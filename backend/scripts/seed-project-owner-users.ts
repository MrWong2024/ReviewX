import { existsSync, readFileSync } from 'node:fs';
import { isAbsolute, resolve } from 'node:path';
import { hash } from 'bcryptjs';
import mongoose, { Model, Types } from 'mongoose';
import { UserRole } from '../src/common/constants/user-roles';
import {
  Organization,
  OrganizationSchema,
} from '../src/modules/organizations/schemas/organization.schema';
import { User, UserSchema } from '../src/modules/users/schemas/user.schema';

type ParsedArgs = {
  file?: string;
  envFile: string;
  dryRun: boolean;
  resetPassword: boolean;
  updateName: boolean;
  allowMissingOrganization: boolean;
  strictOrganization: boolean;
  help: boolean;
};

type CsvRecord = {
  lineNumber: number;
  fields: string[];
};

type CsvRow = {
  lineNumber: number;
  name: string;
  phone: string;
  organizationName: string;
};

type InvalidRow = {
  lineNumber: number;
  phone: string;
  name: string;
  organizationName: string;
  reasons: string[];
};

type EmptyOrganizationRow = {
  lineNumber: number;
  phone: string;
  name: string;
};

type NameConflict = {
  phone: string;
  keptName: string;
  ignoredName: string;
  lineNumber: number;
};

type ImportedOwner = {
  phone: string;
  name: string;
  sourceLineNumber: number;
  organizationNames: Set<string>;
};

type ImportedDataset = {
  filePath: string;
  csvDataRows: number;
  skippedEmptyRows: number;
  owners: ImportedOwner[];
  invalidRows: InvalidRow[];
  emptyOrganizationRows: EmptyOrganizationRow[];
  nameConflicts: NameConflict[];
};

type OrganizationNameLean = {
  _id: Types.ObjectId;
  name: string;
};

type ExistingUserLean = {
  _id: Types.ObjectId;
  phone: string;
  name: string;
  roles?: UserRole[];
  organizationIds?: Types.ObjectId[];
};

type PlannedOwner = {
  owner: ImportedOwner;
  existingUser: ExistingUserLean | null;
  resolvedOrganizationIds: Types.ObjectId[];
  unresolvedOrganizationNames: string[];
  organizationIdsToAdd: Types.ObjectId[];
  addProjectOwnerRole: boolean;
  updateName: boolean;
};

type SeedPlan = {
  owners: PlannedOwner[];
  unresolvedOrganizations: string[];
};

type NewProjectOwnerUserDocument = User & {
  createdAt: Date;
  updatedAt: Date;
};

type UserBulkWriteOperation = Parameters<Model<User>['bulkWrite']>[0][number];

type WriteResultSummary = {
  operationCount: number;
  insertedCount: number;
  matchedCount: number;
  modifiedCount: number;
  upsertedCount: number;
  deletedCount: number;
};

class CliError extends Error {}

const PROJECT_OWNER_ROLE: UserRole = 'project_owner';
const BCRYPT_COST = 12;
const REQUIRED_HEADERS = ['name', 'phone', 'organizationName'] as const;
const ALLOWED_DATABASE_NAMES = ['reviewx_dev', 'reviewx_test'] as const;

const SCRIPT_USAGE = [
  'Usage:',
  '  npm run seed:project-owner-users -- --file <csv-path> [--dry-run] [--env-file .env.development|.env.test] [--reset-password] [--update-name] [--allow-missing-organization|--strict-organization]',
  '',
  'Options:',
  '  --file <path>                    Required CSV file path.',
  '  --dry-run                        Parse, validate, and print the plan without writing.',
  '  --env-file <path>                Optional env file. Defaults to .env.development.',
  '  --reset-password                 Reset existing user passwords to phone-number bcrypt hashes.',
  '  --update-name                    Overwrite existing user names from CSV.',
  '  --allow-missing-organization     Allow unmatched organizations and print them. Default.',
  '  --strict-organization            Fail when any organizationName cannot be matched.',
  '  --help                           Print this help without connecting to MongoDB.',
].join('\n');

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    console.log(SCRIPT_USAGE);
    return;
  }

  if (!args.file) {
    throw new CliError(`${SCRIPT_USAGE}\n\nMissing required argument: --file.`);
  }

  const filePath = resolveFilePath(args.file);
  const dataset = readImportedDataset(filePath);

  loadEnvFile(args.envFile);
  assertSafeRuntime(args.envFile);

  const mongoUri = process.env.MONGO_URI?.trim();
  if (!mongoUri) {
    throw new CliError(
      'MONGO_URI is required. Provide it through process env or a local env file.',
    );
  }

  const databaseName = getDatabaseNameFromMongoUri(mongoUri);
  assertAllowedDatabase(databaseName);

  await mongoose.connect(mongoUri);

  try {
    const connectedDatabaseName = mongoose.connection.db?.databaseName;
    assertAllowedDatabase(connectedDatabaseName);

    const userModel = getUserModel();
    const organizationModel = getOrganizationModel();

    const organizationIdByName = await findOrganizationsByName(
      organizationModel,
      collectOrganizationNames(dataset),
    );
    const existingUserByPhone = await findUsersByPhone(
      userModel,
      dataset.owners.map((owner) => owner.phone),
    );
    const plan = buildSeedPlan(
      dataset,
      organizationIdByName,
      existingUserByPhone,
      args,
    );

    if (args.dryRun) {
      printSummary(args, dataset, plan, connectedDatabaseName);
      assertPlanCanWrite(args, dataset, plan);
      return;
    }

    assertPlanCanWrite(args, dataset, plan);
    const writeResult = await executeSeedPlan(userModel, plan, args);
    printSummary(args, dataset, plan, connectedDatabaseName, writeResult);
  } finally {
    await mongoose.disconnect();
  }
}

function parseArgs(argv: string[]): ParsedArgs {
  const args: ParsedArgs = {
    envFile: '.env.development',
    dryRun: false,
    resetPassword: false,
    updateName: false,
    allowMissingOrganization: true,
    strictOrganization: false,
    help: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];

    if (current === '--help') {
      args.help = true;
      continue;
    }

    if (current === '--dry-run') {
      args.dryRun = true;
      continue;
    }

    if (current === '--reset-password') {
      args.resetPassword = true;
      continue;
    }

    if (current === '--update-name') {
      args.updateName = true;
      continue;
    }

    if (current === '--allow-missing-organization') {
      args.allowMissingOrganization = true;
      continue;
    }

    if (current === '--strict-organization') {
      args.strictOrganization = true;
      continue;
    }

    if (!current.startsWith('--')) {
      throw new CliError(`${SCRIPT_USAGE}\n\nUnexpected argument: ${current}`);
    }

    const key = current.slice(2);
    const value = argv[index + 1];

    if (!value || value.startsWith('--')) {
      throw new CliError(`${SCRIPT_USAGE}\n\nMissing value for ${current}.`);
    }

    index += 1;
    assignArg(args, key, value);
  }

  if (args.strictOrganization) {
    args.allowMissingOrganization = false;
  }

  return args;
}

function assignArg(args: ParsedArgs, key: string, value: string): void {
  if (key === 'file') {
    args.file = value;
    return;
  }

  if (key === 'env-file') {
    args.envFile = value;
    return;
  }

  throw new CliError(`${SCRIPT_USAGE}\n\nUnknown argument: --${key}`);
}

function resolveFilePath(filePath: string): string {
  return isAbsolute(filePath) ? filePath : resolve(process.cwd(), filePath);
}

function readImportedDataset(filePath: string): ImportedDataset {
  if (!existsSync(filePath)) {
    throw new CliError(`CSV file not found: ${filePath}`);
  }

  const content = stripUtf8Bom(readFileSync(filePath, 'utf8'));
  const records = parseCsvRecords(content);

  if (records.length === 0) {
    throw new CliError('CSV file is empty.');
  }

  const header = records[0].fields.map((field) => field.trim());
  const headerIndexByName = buildHeaderIndex(header);
  const dataRecords = records.slice(1);
  const rows: CsvRow[] = [];
  let skippedEmptyRows = 0;

  for (const record of dataRecords) {
    if (isEmptyCsvRecord(record)) {
      skippedEmptyRows += 1;
      continue;
    }

    rows.push({
      lineNumber: record.lineNumber,
      name: getRecordValue(record, headerIndexByName.get('name')),
      phone: getRecordValue(record, headerIndexByName.get('phone')),
      organizationName: getRecordValue(
        record,
        headerIndexByName.get('organizationName'),
      ),
    });
  }

  return mergeRows(filePath, dataRecords.length, skippedEmptyRows, rows);
}

function stripUtf8Bom(content: string): string {
  return content.charCodeAt(0) === 0xfeff ? content.slice(1) : content;
}

function parseCsvRecords(content: string): CsvRecord[] {
  const normalizedContent = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const records: CsvRecord[] = [];
  let fields: string[] = [];
  let field = '';
  let inQuotes = false;
  let lineNumber = 1;
  let recordLineNumber = 1;

  for (let index = 0; index < normalizedContent.length; index += 1) {
    const current = normalizedContent[index];

    if (inQuotes) {
      if (current === '"') {
        const next = normalizedContent[index + 1];

        if (next === '"') {
          field += '"';
          index += 1;
          continue;
        }

        inQuotes = false;
        continue;
      }

      field += current;

      if (current === '\n') {
        lineNumber += 1;
      }

      continue;
    }

    if (current === '"') {
      if (field.length === 0) {
        inQuotes = true;
        continue;
      }

      field += current;
      continue;
    }

    if (current === ',') {
      fields.push(field);
      field = '';
      continue;
    }

    if (current === '\n') {
      fields.push(field);
      records.push({ lineNumber: recordLineNumber, fields });
      fields = [];
      field = '';
      lineNumber += 1;
      recordLineNumber = lineNumber;
      continue;
    }

    field += current;
  }

  if (inQuotes) {
    throw new CliError(
      `CSV parse error: unclosed quoted field near line ${recordLineNumber}.`,
    );
  }

  if (
    field.length > 0 ||
    fields.length > 0 ||
    (normalizedContent.length > 0 && !normalizedContent.endsWith('\n'))
  ) {
    fields.push(field);
    records.push({ lineNumber: recordLineNumber, fields });
  }

  return records;
}

function buildHeaderIndex(header: string[]): Map<string, number> {
  const headerIndexByName = new Map<string, number>();

  header.forEach((headerName, index) => {
    if (!headerIndexByName.has(headerName)) {
      headerIndexByName.set(headerName, index);
    }
  });

  const missingHeaders = REQUIRED_HEADERS.filter(
    (headerName) => !headerIndexByName.has(headerName),
  );

  if (missingHeaders.length > 0) {
    throw new CliError(
      `CSV header is missing required columns: ${missingHeaders.join(', ')}.`,
    );
  }

  return headerIndexByName;
}

function isEmptyCsvRecord(record: CsvRecord): boolean {
  return record.fields.every((field) => field.trim() === '');
}

function getRecordValue(record: CsvRecord, index: number | undefined): string {
  if (index === undefined) {
    return '';
  }

  return record.fields[index] ?? '';
}

function mergeRows(
  filePath: string,
  csvDataRows: number,
  skippedEmptyRows: number,
  rows: CsvRow[],
): ImportedDataset {
  const ownerByPhone = new Map<string, ImportedOwner>();
  const invalidRows: InvalidRow[] = [];
  const emptyOrganizationRows: EmptyOrganizationRow[] = [];
  const nameConflicts: NameConflict[] = [];

  for (const row of rows) {
    const name = row.name.trim();
    const phone = row.phone.trim();
    const organizationName = row.organizationName.trim();
    const reasons = validateRow({ name, phone });

    if (reasons.length > 0) {
      invalidRows.push({
        lineNumber: row.lineNumber,
        phone,
        name,
        organizationName,
        reasons,
      });
      continue;
    }

    if (!organizationName) {
      emptyOrganizationRows.push({
        lineNumber: row.lineNumber,
        phone,
        name,
      });
    }

    const existingOwner = ownerByPhone.get(phone);

    if (!existingOwner) {
      ownerByPhone.set(phone, {
        phone,
        name,
        sourceLineNumber: row.lineNumber,
        organizationNames: organizationName
          ? new Set([organizationName])
          : new Set<string>(),
      });
      continue;
    }

    if (existingOwner.name !== name) {
      nameConflicts.push({
        phone,
        keptName: existingOwner.name,
        ignoredName: name,
        lineNumber: row.lineNumber,
      });
    }

    if (organizationName) {
      existingOwner.organizationNames.add(organizationName);
    }
  }

  return {
    filePath,
    csvDataRows,
    skippedEmptyRows,
    owners: [...ownerByPhone.values()],
    invalidRows,
    emptyOrganizationRows,
    nameConflicts,
  };
}

function validateRow(input: { name: string; phone: string }): string[] {
  const reasons: string[] = [];

  if (!input.name) {
    reasons.push('name is required');
  }

  if (!input.phone) {
    reasons.push('phone is required');
  } else if (!/^\d{11}$/.test(input.phone)) {
    reasons.push('phone must contain exactly 11 digits');
  }

  return reasons;
}

function collectOrganizationNames(dataset: ImportedDataset): string[] {
  const names = new Set<string>();

  for (const owner of dataset.owners) {
    for (const organizationName of owner.organizationNames) {
      names.add(organizationName);
    }
  }

  return [...names];
}

async function findOrganizationsByName(
  organizationModel: Model<Organization>,
  organizationNames: string[],
): Promise<Map<string, Types.ObjectId>> {
  if (organizationNames.length === 0) {
    return new Map();
  }

  const organizations = await organizationModel
    .find({ name: { $in: organizationNames } })
    .select({ _id: 1, name: 1 })
    .lean<OrganizationNameLean[]>()
    .exec();

  return new Map(
    organizations.map((organization) => [organization.name, organization._id]),
  );
}

async function findUsersByPhone(
  userModel: Model<User>,
  phones: string[],
): Promise<Map<string, ExistingUserLean>> {
  if (phones.length === 0) {
    return new Map();
  }

  const users = await userModel
    .find({ phone: { $in: phones } })
    .select({ _id: 1, phone: 1, name: 1, roles: 1, organizationIds: 1 })
    .lean<ExistingUserLean[]>()
    .exec();

  return new Map(users.map((user) => [user.phone, user]));
}

function buildSeedPlan(
  dataset: ImportedDataset,
  organizationIdByName: Map<string, Types.ObjectId>,
  existingUserByPhone: Map<string, ExistingUserLean>,
  args: ParsedArgs,
): SeedPlan {
  const unresolvedOrganizations = new Set<string>();
  const owners = dataset.owners.map((owner): PlannedOwner => {
    const resolvedOrganizationIds: Types.ObjectId[] = [];
    const unresolvedOrganizationNames: string[] = [];

    for (const organizationName of owner.organizationNames) {
      const organizationId = organizationIdByName.get(organizationName);

      if (organizationId) {
        resolvedOrganizationIds.push(organizationId);
        continue;
      }

      unresolvedOrganizationNames.push(organizationName);
      unresolvedOrganizations.add(organizationName);
    }

    const existingUser = existingUserByPhone.get(owner.phone) ?? null;
    const existingOrganizationIds = new Set(
      (existingUser?.organizationIds ?? []).map((id) => id.toString()),
    );
    const organizationIdsToAdd = existingUser
      ? resolvedOrganizationIds.filter(
          (organizationId) =>
            !existingOrganizationIds.has(organizationId.toString()),
        )
      : resolvedOrganizationIds;
    const addProjectOwnerRole = existingUser
      ? !(existingUser.roles ?? []).includes(PROJECT_OWNER_ROLE)
      : true;

    return {
      owner,
      existingUser,
      resolvedOrganizationIds,
      unresolvedOrganizationNames,
      organizationIdsToAdd,
      addProjectOwnerRole,
      updateName:
        args.updateName &&
        Boolean(existingUser) &&
        existingUser?.name !== owner.name,
    };
  });

  return {
    owners,
    unresolvedOrganizations: [...unresolvedOrganizations],
  };
}

function assertPlanCanWrite(
  args: ParsedArgs,
  dataset: ImportedDataset,
  plan: SeedPlan,
): void {
  if (dataset.invalidRows.length > 0) {
    throw new CliError('CSV contains invalid rows. Fix them before writing.');
  }

  if (args.strictOrganization && plan.unresolvedOrganizations.length > 0) {
    throw new CliError(
      'Unmatched organizations were found and --strict-organization is enabled.',
    );
  }
}

async function executeSeedPlan(
  userModel: Model<User>,
  plan: SeedPlan,
  args: ParsedArgs,
): Promise<WriteResultSummary> {
  const now = new Date();
  const operations: UserBulkWriteOperation[] = [];

  for (const plannedOwner of plan.owners) {
    if (!plannedOwner.existingUser) {
      const document: NewProjectOwnerUserDocument = {
        phone: plannedOwner.owner.phone,
        passwordHash: await hash(plannedOwner.owner.phone, BCRYPT_COST),
        name: plannedOwner.owner.name,
        roles: [PROJECT_OWNER_ROLE],
        organizationIds: plannedOwner.resolvedOrganizationIds,
        disciplineIds: [],
        mustChangePassword: true,
        isActive: true,
        status: 'active',
        createdAt: now,
        updatedAt: now,
      };

      operations.push({
        insertOne: {
          document,
        },
      });
      continue;
    }

    const setUpdate: Partial<User> & { updatedAt: Date } = {
      updatedAt: now,
    };

    if (args.resetPassword) {
      setUpdate.passwordHash = await hash(
        plannedOwner.owner.phone,
        BCRYPT_COST,
      );
    }

    if (plannedOwner.updateName) {
      setUpdate.name = plannedOwner.owner.name;
    }

    const addToSetUpdate: {
      roles: UserRole;
      organizationIds?: { $each: Types.ObjectId[] };
    } = {
      roles: PROJECT_OWNER_ROLE,
    };

    if (plannedOwner.organizationIdsToAdd.length > 0) {
      addToSetUpdate.organizationIds = {
        $each: plannedOwner.organizationIdsToAdd,
      };
    }

    operations.push({
      updateOne: {
        filter: { _id: plannedOwner.existingUser._id },
        update: {
          $set: setUpdate,
          $addToSet: addToSetUpdate,
        },
      },
    });
  }

  if (operations.length === 0) {
    return {
      operationCount: 0,
      insertedCount: 0,
      matchedCount: 0,
      modifiedCount: 0,
      upsertedCount: 0,
      deletedCount: 0,
    };
  }

  const result = await userModel.bulkWrite(operations, { ordered: false });

  return {
    operationCount: operations.length,
    insertedCount: result.insertedCount,
    matchedCount: result.matchedCount,
    modifiedCount: result.modifiedCount,
    upsertedCount: result.upsertedCount,
    deletedCount: result.deletedCount,
  };
}

function printSummary(
  args: ParsedArgs,
  dataset: ImportedDataset,
  plan: SeedPlan,
  databaseName: string | undefined,
  writeResult?: WriteResultSummary,
): void {
  const newOwners = plan.owners.filter((entry) => !entry.existingUser);
  const existingOwners = plan.owners.filter((entry) => entry.existingUser);
  const existingOwnersToAddRole = existingOwners.filter(
    (entry) => entry.addProjectOwnerRole,
  );
  const existingOwnersToAppendOrganizations = existingOwners.filter(
    (entry) => entry.organizationIdsToAdd.length > 0,
  );
  const existingOwnersToUpdateName = existingOwners.filter(
    (entry) => entry.updateName,
  );

  console.log(
    JSON.stringify(
      {
        mode: args.dryRun ? 'dry-run' : 'write',
        file: dataset.filePath,
        databaseName,
        options: {
          resetPassword: args.resetPassword,
          updateName: args.updateName,
          allowMissingOrganization: args.allowMissingOrganization,
          strictOrganization: args.strictOrganization,
        },
        csv: {
          dataRows: dataset.csvDataRows,
          skippedEmptyRows: dataset.skippedEmptyRows,
          uniquePhones: dataset.owners.length,
        },
        plan: {
          createUsers: newOwners.length,
          existingUsers: existingOwners.length,
          newUsersWithOrganizationIds: newOwners.filter(
            (entry) => entry.resolvedOrganizationIds.length > 0,
          ).length,
          existingUsersToAddProjectOwnerRole: existingOwnersToAddRole.length,
          existingUsersToAppendOrganizationIds:
            existingOwnersToAppendOrganizations.length,
          existingUsersToResetPassword: args.resetPassword
            ? existingOwners.length
            : 0,
          existingUsersToUpdateName: existingOwnersToUpdateName.length,
          unresolvedOrganizationCount: plan.unresolvedOrganizations.length,
          invalidRowCount: dataset.invalidRows.length,
          nameConflictCount: dataset.nameConflicts.length,
          emptyOrganizationRowCount: dataset.emptyOrganizationRows.length,
        },
        unresolvedOrganizations: plan.unresolvedOrganizations,
        invalidRows: dataset.invalidRows,
        nameConflicts: dataset.nameConflicts,
        emptyOrganizationRows: dataset.emptyOrganizationRows,
        writeResult: writeResult ?? null,
      },
      null,
      2,
    ),
  );
}

function loadEnvFile(envFile: string): void {
  const envFilePath = resolveEnvFilePath(envFile);

  if (!existsSync(envFilePath)) {
    if (process.env.MONGO_URI?.trim()) {
      return;
    }

    throw new CliError(
      `Env file not found: ${envFile}. Provide a local env file or process env MONGO_URI.`,
    );
  }

  const content = readFileSync(envFilePath, 'utf8');

  for (const line of content.split(/\r?\n/)) {
    const parsed = parseEnvLine(line);

    if (!parsed) {
      continue;
    }

    const [key, value] = parsed;

    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function resolveEnvFilePath(envFile: string): string {
  return isAbsolute(envFile) ? envFile : resolve(process.cwd(), envFile);
}

function parseEnvLine(line: string): [string, string] | null {
  const trimmedLine = line.trim();

  if (!trimmedLine || trimmedLine.startsWith('#')) {
    return null;
  }

  const separatorIndex = trimmedLine.indexOf('=');

  if (separatorIndex <= 0) {
    return null;
  }

  const key = trimmedLine.slice(0, separatorIndex).trim();
  const rawValue = trimmedLine.slice(separatorIndex + 1).trim();

  return [key, stripMatchingQuotes(rawValue)];
}

function stripMatchingQuotes(value: string): string {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

function assertSafeRuntime(envFile: string): void {
  const normalizedEnvFile = envFile.toLowerCase();

  if (normalizedEnvFile.includes('production')) {
    throw new CliError('Refusing to run against a production env file.');
  }

  if (process.env.NODE_ENV === 'production') {
    throw new CliError('Refusing to run when NODE_ENV=production.');
  }
}

function getDatabaseNameFromMongoUri(uri: string): string | undefined {
  const uriWithoutScheme = uri.replace(/^mongodb(\+srv)?:\/\//, '');
  const slashIndex = uriWithoutScheme.indexOf('/');

  if (slashIndex < 0) {
    return undefined;
  }

  const pathAndQuery = uriWithoutScheme.slice(slashIndex + 1);
  const databaseName = pathAndQuery.split(/[?#]/)[0];

  return databaseName ? decodeURIComponent(databaseName) : undefined;
}

function assertAllowedDatabase(databaseName: string | undefined): void {
  if (
    !databaseName ||
    !ALLOWED_DATABASE_NAMES.includes(
      databaseName as (typeof ALLOWED_DATABASE_NAMES)[number],
    )
  ) {
    throw new CliError(
      'Refusing to run. Target database must be reviewx_dev or reviewx_test.',
    );
  }
}

function getUserModel(): Model<User> {
  return mongoose.models[User.name]
    ? mongoose.model<User>(User.name)
    : mongoose.model<User>(User.name, UserSchema);
}

function getOrganizationModel(): Model<Organization> {
  return mongoose.models[Organization.name]
    ? mongoose.model<Organization>(Organization.name)
    : mongoose.model<Organization>(Organization.name, OrganizationSchema);
}

main().catch((error: unknown) => {
  if (error instanceof CliError) {
    console.error(error.message);
    process.exitCode = 1;
    return;
  }

  const message = error instanceof Error ? error.message : 'Unknown error';
  console.error(`Failed to seed project owner users: ${message}`);
  process.exitCode = 1;
});
