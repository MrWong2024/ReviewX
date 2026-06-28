const DEFAULT_PORT = 5001;
const DEFAULT_FRONTEND_URL = 'http://localhost:3001';
const DEFAULT_PRODUCTION_MONGO_URI = '';
const DEFAULT_MONGO_SERVER_SELECTION_TIMEOUT_MS = 5000;
const DEFAULT_SESSION_COOKIE_NAME = 'reviewx_session';
const DEFAULT_SESSION_TTL_MS = 86_400_000;
const DEFAULT_MAX_ACTIVE_SESSIONS_PER_USER = 5;
const DEFAULT_SESSION_COOKIE_SAME_SITE = 'lax';
const DEFAULT_LLM_PROVIDER = 'stub';
const DEFAULT_BAILIAN_BASE_URL =
  'https://dashscope.aliyuncs.com/compatible-mode/v1';
const DEFAULT_BAILIAN_TIMEOUT_MS = 90000;
const DEFAULT_BAILIAN_MAX_RETRIES = 1;
const DEFAULT_CONSENSUS_DRAFT_COOLDOWN_SECONDS = 60;

type AppEnvironment = 'development' | 'test' | 'production';
export type SessionCookieSameSite = 'lax' | 'strict' | 'none';

const SESSION_COOKIE_SAME_SITE_VALUES = ['lax', 'strict', 'none'] as const;

function parseNumber(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function parseNonNegativeNumber(
  value: string | undefined,
  fallback: number,
): number {
  const parsed = parseNumber(value, fallback);

  return parsed >= 0 ? parsed : fallback;
}

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (!value) {
    return fallback;
  }

  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  return fallback;
}

function parseCookieSameSite(value: string | undefined): SessionCookieSameSite {
  if (
    SESSION_COOKIE_SAME_SITE_VALUES.includes(value as SessionCookieSameSite)
  ) {
    return value as SessionCookieSameSite;
  }

  return DEFAULT_SESSION_COOKIE_SAME_SITE;
}

function resolveAppEnvironment(): AppEnvironment {
  if (process.env.NODE_ENV === 'test') {
    return 'test';
  }

  if (process.env.NODE_ENV === 'production') {
    return 'production';
  }

  return 'development';
}

function getDefaultMongoUri(env: AppEnvironment): string {
  if (env === 'test') {
    return 'mongodb://reviewx_test_app:{REVIEWX_TEST_APP_PASSWORD}@127.0.0.1:27017/reviewx_test?authSource=reviewx_test';
  }

  if (env === 'production') {
    return DEFAULT_PRODUCTION_MONGO_URI;
  }

  return 'mongodb://reviewx_dev_app:{REVIEWX_DEV_APP_PASSWORD}@127.0.0.1:27017/reviewx_dev?authSource=reviewx_dev';
}

function getDefaultMongoAutoIndex(env: AppEnvironment): boolean {
  return env !== 'production';
}

function getDefaultMongoAdminUri(env: AppEnvironment): string {
  if (env === 'test') {
    return 'mongodb://reviewx_test_db_admin:{REVIEWX_TEST_DB_ADMIN_PASSWORD}@127.0.0.1:27017/reviewx_test?authSource=reviewx_test';
  }

  if (env === 'production') {
    return DEFAULT_PRODUCTION_MONGO_URI;
  }

  return 'mongodb://reviewx_dev_db_admin:{REVIEWX_DEV_DB_ADMIN_PASSWORD}@127.0.0.1:27017/reviewx_dev?authSource=reviewx_dev';
}

function resolveMongoUri(
  value: string | undefined,
  env: AppEnvironment,
): string {
  if (!value) {
    return getDefaultMongoUri(env);
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : getDefaultMongoUri(env);
}

function resolveMongoAdminUri(
  value: string | undefined,
  env: AppEnvironment,
): string {
  if (!value) {
    return getDefaultMongoAdminUri(env);
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : getDefaultMongoAdminUri(env);
}

export default () => {
  const env = resolveAppEnvironment();

  return {
    app: {
      env,
      port: parseNumber(process.env.PORT, DEFAULT_PORT),
      frontendUrl: process.env.FRONTEND_URL ?? DEFAULT_FRONTEND_URL,
      corsOrigin:
        process.env.CORS_ORIGIN ??
        process.env.FRONTEND_URL ??
        DEFAULT_FRONTEND_URL,
    },
    mongo: {
      uri: resolveMongoUri(process.env.MONGO_URI, env),
      adminUri: resolveMongoAdminUri(process.env.MONGO_ADMIN_URI, env),
      autoIndex: parseBoolean(
        process.env.MONGO_AUTO_INDEX,
        getDefaultMongoAutoIndex(env),
      ),
      serverSelectionTimeoutMs: parseNumber(
        process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS,
        DEFAULT_MONGO_SERVER_SELECTION_TIMEOUT_MS,
      ),
    },
    session: {
      cookieName:
        process.env.SESSION_COOKIE_NAME ?? DEFAULT_SESSION_COOKIE_NAME,
      ttlMs: parseNumber(process.env.SESSION_TTL_MS, DEFAULT_SESSION_TTL_MS),
      maxActiveSessionsPerUser: parseNumber(
        process.env.MAX_ACTIVE_SESSIONS_PER_USER,
        DEFAULT_MAX_ACTIVE_SESSIONS_PER_USER,
      ),
      cookieSecure: parseBoolean(
        process.env.SESSION_COOKIE_SECURE,
        env === 'production',
      ),
      cookieSameSite: parseCookieSameSite(process.env.SESSION_COOKIE_SAME_SITE),
    },
    llm: {
      provider: process.env.LLM_PROVIDER ?? DEFAULT_LLM_PROVIDER,
      bailian: {
        apiKey: process.env.BAILIAN_API_KEY ?? '',
        baseUrl: process.env.BAILIAN_BASE_URL ?? DEFAULT_BAILIAN_BASE_URL,
        model: process.env.BAILIAN_MODEL ?? '',
        timeoutMs: parseNumber(
          process.env.BAILIAN_TIMEOUT_MS,
          DEFAULT_BAILIAN_TIMEOUT_MS,
        ),
        maxRetries: parseNumber(
          process.env.BAILIAN_MAX_RETRIES,
          DEFAULT_BAILIAN_MAX_RETRIES,
        ),
      },
    },
    consensusDraft: {
      cooldownSeconds: parseNonNegativeNumber(
        process.env.CONSENSUS_DRAFT_COOLDOWN_SECONDS,
        DEFAULT_CONSENSUS_DRAFT_COOLDOWN_SECONDS,
      ),
    },
  };
};
