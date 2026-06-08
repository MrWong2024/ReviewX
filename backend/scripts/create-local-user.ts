import { existsSync, readFileSync } from 'node:fs';
import { isAbsolute, resolve } from 'node:path';
import { hash } from 'bcryptjs';
import mongoose, { Model } from 'mongoose';
import { User, UserSchema } from '../src/modules/users/schemas/user.schema';

type UserStatus = 'active' | 'disabled';

type ParsedArgs = {
  phone?: string;
  password?: string;
  name?: string;
  roles?: string;
  status?: string;
  envFile: string;
  resetPassword: boolean;
};

type CreateLocalUserInput = {
  phone: string;
  password: string;
  name: string;
  roles: string[];
  status: UserStatus;
  envFile: string;
  resetPassword: boolean;
};

class CliError extends Error {}

const SCRIPT_USAGE = [
  'Usage:',
  '  npm run create-local-user -- --phone <phone> --password <password> --name <name> [--roles roleA,roleB] [--status active|disabled] [--env-file .env.development|.env.test] [--reset-password]',
].join('\n');

const ALLOWED_DATABASE_NAMES = ['reviewx_dev', 'reviewx_test'] as const;

async function main(): Promise<void> {
  const input = parseInput(process.argv.slice(2));

  loadEnvFile(input.envFile);
  assertSafeRuntime(input.envFile);

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
    const existingUser = await userModel.findOne({ phone: input.phone }).exec();
    const passwordHash = await hash(input.password, 12);

    if (!existingUser) {
      await userModel.create({
        phone: input.phone,
        passwordHash,
        name: input.name,
        roles: input.roles,
        status: input.status,
      });

      printResult('created', input, connectedDatabaseName);
      return;
    }

    if (!input.resetPassword) {
      throw new CliError(
        'User already exists. Re-run with --reset-password to update the local password.',
      );
    }

    existingUser.passwordHash = passwordHash;
    existingUser.name = input.name;
    existingUser.roles = input.roles;
    existingUser.status = input.status;
    await existingUser.save();

    printResult('updated', input, connectedDatabaseName);
  } finally {
    await mongoose.disconnect();
  }
}

function parseInput(argv: string[]): CreateLocalUserInput {
  const args = parseArgs(argv);
  const phone = args.phone?.trim();
  const password = args.password;
  const name = args.name?.trim();
  const roles = parseRoles(args.roles);
  const status = parseStatus(args.status);

  if (!phone || !password || !name) {
    throw new CliError(`${SCRIPT_USAGE}\n\nMissing required arguments.`);
  }

  return {
    phone,
    password,
    name,
    roles,
    status,
    envFile: args.envFile,
    resetPassword: args.resetPassword,
  };
}

function parseArgs(argv: string[]): ParsedArgs {
  const args: ParsedArgs = {
    envFile: '.env.development',
    resetPassword: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];

    if (current === '--reset-password') {
      args.resetPassword = true;
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

  return args;
}

function assignArg(args: ParsedArgs, key: string, value: string): void {
  if (key === 'phone') {
    args.phone = value;
    return;
  }

  if (key === 'password') {
    args.password = value;
    return;
  }

  if (key === 'name') {
    args.name = value;
    return;
  }

  if (key === 'roles') {
    args.roles = value;
    return;
  }

  if (key === 'status') {
    args.status = value;
    return;
  }

  if (key === 'env-file') {
    args.envFile = value;
    return;
  }

  throw new CliError(`${SCRIPT_USAGE}\n\nUnknown argument: --${key}`);
}

function parseRoles(value: string | undefined): string[] {
  if (!value) {
    return [];
  }

  return value
    .split(',')
    .map((role) => role.trim())
    .filter(Boolean);
}

function parseStatus(value: string | undefined): UserStatus {
  if (!value) {
    return 'active';
  }

  if (value === 'active' || value === 'disabled') {
    return value;
  }

  throw new CliError(
    'Invalid --status value. Allowed values: active, disabled.',
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

function printResult(
  action: 'created' | 'updated',
  input: CreateLocalUserInput,
  databaseName: string | undefined,
): void {
  console.log(
    JSON.stringify(
      {
        action,
        phone: input.phone,
        name: input.name,
        roles: input.roles,
        status: input.status,
        databaseName,
      },
      null,
      2,
    ),
  );
}

main().catch((error: unknown) => {
  if (error instanceof CliError) {
    console.error(error.message);
    process.exitCode = 1;
    return;
  }

  console.error('Failed to create or update local user.');
  process.exitCode = 1;
});
