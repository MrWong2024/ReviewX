import { existsSync, readFileSync } from 'node:fs';
import { isAbsolute, relative, resolve } from 'node:path';
import mongoose, { Model } from 'mongoose';
import {
  Batch,
  BatchSchema,
} from '../src/modules/batches/schemas/batch.schema';
import {
  Dictionary,
  DictionarySchema,
} from '../src/modules/dictionaries/schemas/dictionary.schema';
import {
  Organization,
  OrganizationSchema,
} from '../src/modules/organizations/schemas/organization.schema';
import {
  ProjectExpertAssignment,
  ProjectExpertAssignmentSchema,
} from '../src/modules/project-expert-assignments/schemas/project-expert-assignment.schema';
import {
  Project,
  ProjectSchema,
} from '../src/modules/projects/schemas/project.schema';
import {
  ProjectImportJob,
  ProjectImportJobSchema,
} from '../src/modules/project-imports/schemas/project-import-job.schema';
import {
  ProjectImportRow,
  ProjectImportRowSchema,
} from '../src/modules/project-imports/schemas/project-import-row.schema';
import {
  ReviewScheme,
  ReviewSchemeSchema,
} from '../src/modules/review-schemes/schemas/review-scheme.schema';
import {
  Session,
  SessionSchema,
} from '../src/modules/sessions/schemas/session.schema';
import {
  TreeDictionary,
  TreeDictionarySchema,
} from '../src/modules/tree-dictionaries/schemas/tree-dictionary.schema';
import { User, UserSchema } from '../src/modules/users/schemas/user.schema';

/*
 * syncIndexes() makes database indexes match the indexes declared by schemas.
 * It may drop database indexes that are not declared in the current schema.
 * Confirm schema index definitions before running against production.
 * Production requires --confirm-production and should be run after backup or
 * during a maintenance window.
 */

type ParsedArgs = {
  envFile: string;
  confirmProduction: boolean;
};

type RegisteredModel = {
  name: string;
  model: Model<unknown>;
};

class CliError extends Error {}

const SCRIPT_USAGE = [
  'Usage:',
  '  npm run sync-indexes -- [--env-file .env.development|.env.test|.env.production] [--confirm-production]',
].join('\n');

const ALLOWED_DATABASE_NAMES = [
  'reviewx_dev',
  'reviewx_test',
  'reviewx',
] as const;
const PRODUCTION_DATABASE_NAME = 'reviewx';
const BACKEND_ROOT = process.cwd();

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  loadEnvFile(args.envFile);

  const mongoAdminUri = process.env.MONGO_ADMIN_URI?.trim();
  if (!mongoAdminUri) {
    throw new CliError(
      'MONGO_ADMIN_URI is required. Provide it through process env or an env file.',
    );
  }

  const databaseName = getDatabaseNameFromMongoUri(mongoAdminUri);
  assertAllowedDatabase(databaseName);

  const nodeEnv = process.env.NODE_ENV ?? 'development';
  const isProductionTarget =
    nodeEnv === 'production' || databaseName === PRODUCTION_DATABASE_NAME;

  if (isProductionTarget && !args.confirmProduction) {
    throw new CliError(
      'Refusing to sync production indexes without --confirm-production.',
    );
  }

  const registeredModels = registerModels();

  printPlan({
    nodeEnv,
    databaseName,
    isProductionTarget,
    modelNames: registeredModels.map((entry) => entry.name),
  });

  await mongoose.connect(mongoAdminUri);

  try {
    const connectedDatabaseName = mongoose.connection.db?.databaseName;
    assertAllowedDatabase(connectedDatabaseName);

    for (const entry of registeredModels) {
      const result = await entry.model.syncIndexes();
      printModelResult(entry.name, result);
    }

    console.log(
      JSON.stringify(
        {
          status: 'ok',
          databaseName: connectedDatabaseName,
          syncedModels: registeredModels.map((entry) => entry.name),
        },
        null,
        2,
      ),
    );
  } finally {
    await mongoose.disconnect();
  }
}

function parseArgs(argv: string[]): ParsedArgs {
  const args: ParsedArgs = {
    envFile: '.env.development',
    confirmProduction: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];

    if (current === '--confirm-production') {
      args.confirmProduction = true;
      continue;
    }

    if (current !== '--env-file') {
      throw new CliError(`${SCRIPT_USAGE}\n\nUnknown argument: ${current}`);
    }

    const value = argv[index + 1];

    if (!value || value.startsWith('--')) {
      throw new CliError(`${SCRIPT_USAGE}\n\nMissing value for --env-file.`);
    }

    args.envFile = value;
    index += 1;
  }

  return args;
}

function loadEnvFile(envFile: string): void {
  const envFilePath = resolveEnvFilePath(envFile);

  if (!existsSync(envFilePath)) {
    if (process.env.MONGO_ADMIN_URI?.trim()) {
      return;
    }

    throw new CliError(
      `Env file not found: ${envFile}. Provide an env file or process env MONGO_ADMIN_URI.`,
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
  if (isAbsolute(envFile)) {
    throw new CliError('Env file path must be relative to backend directory.');
  }

  const resolvedPath = resolve(BACKEND_ROOT, envFile);
  const relativePath = relative(BACKEND_ROOT, resolvedPath);

  if (relativePath.startsWith('..') || isAbsolute(relativePath)) {
    throw new CliError('Env file path must stay inside backend directory.');
  }

  return resolvedPath;
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
      'Refusing to run. Target database must be reviewx_dev, reviewx_test, or reviewx.',
    );
  }
}

function registerModels(): RegisteredModel[] {
  const userModel = mongoose.models[User.name]
    ? mongoose.model<unknown>(User.name)
    : mongoose.model(User.name, UserSchema);
  const sessionModel = mongoose.models[Session.name]
    ? mongoose.model<unknown>(Session.name)
    : mongoose.model(Session.name, SessionSchema);
  const batchModel = mongoose.models[Batch.name]
    ? mongoose.model<unknown>(Batch.name)
    : mongoose.model(Batch.name, BatchSchema);
  const dictionaryModel = mongoose.models[Dictionary.name]
    ? mongoose.model<unknown>(Dictionary.name)
    : mongoose.model(Dictionary.name, DictionarySchema);
  const treeDictionaryModel = mongoose.models[TreeDictionary.name]
    ? mongoose.model<unknown>(TreeDictionary.name)
    : mongoose.model(TreeDictionary.name, TreeDictionarySchema);
  const organizationModel = mongoose.models[Organization.name]
    ? mongoose.model<unknown>(Organization.name)
    : mongoose.model(Organization.name, OrganizationSchema);
  const reviewSchemeModel = mongoose.models[ReviewScheme.name]
    ? mongoose.model<unknown>(ReviewScheme.name)
    : mongoose.model(ReviewScheme.name, ReviewSchemeSchema);
  const projectModel = mongoose.models[Project.name]
    ? mongoose.model<unknown>(Project.name)
    : mongoose.model(Project.name, ProjectSchema);
  const projectExpertAssignmentModel = mongoose.models[
    ProjectExpertAssignment.name
  ]
    ? mongoose.model<unknown>(ProjectExpertAssignment.name)
    : mongoose.model(
        ProjectExpertAssignment.name,
        ProjectExpertAssignmentSchema,
      );
  const projectImportJobModel = mongoose.models[ProjectImportJob.name]
    ? mongoose.model<unknown>(ProjectImportJob.name)
    : mongoose.model(ProjectImportJob.name, ProjectImportJobSchema);
  const projectImportRowModel = mongoose.models[ProjectImportRow.name]
    ? mongoose.model<unknown>(ProjectImportRow.name)
    : mongoose.model(ProjectImportRow.name, ProjectImportRowSchema);

  return [
    { name: User.name, model: userModel },
    { name: Session.name, model: sessionModel },
    { name: Batch.name, model: batchModel },
    { name: Dictionary.name, model: dictionaryModel },
    { name: TreeDictionary.name, model: treeDictionaryModel },
    { name: Organization.name, model: organizationModel },
    { name: ReviewScheme.name, model: reviewSchemeModel },
    { name: Project.name, model: projectModel },
    { name: ProjectExpertAssignment.name, model: projectExpertAssignmentModel },
    { name: ProjectImportJob.name, model: projectImportJobModel },
    { name: ProjectImportRow.name, model: projectImportRowModel },
  ];
}

function printPlan(input: {
  nodeEnv: string;
  databaseName: string | undefined;
  isProductionTarget: boolean;
  modelNames: string[];
}): void {
  console.log(
    JSON.stringify(
      {
        nodeEnv: input.nodeEnv,
        databaseName: input.databaseName,
        isProduction: input.isProductionTarget,
        models: input.modelNames,
      },
      null,
      2,
    ),
  );
}

function printModelResult(modelName: string, result: unknown): void {
  console.log(
    JSON.stringify(
      {
        modelName,
        syncIndexesResult: result,
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

  const message = error instanceof Error ? error.message : 'Unknown error';
  console.error(`Failed to sync indexes: ${message}`);
  process.exitCode = 1;
});
