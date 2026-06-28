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
const DEFAULT_SMS_AUTH_PROVIDER = 'stub';
const DEFAULT_ALIYUN_SMS_REGION_ID = 'cn-shenzhen';
const DEFAULT_ALIYUN_SMS_ENDPOINT = 'dypnsapi.aliyuncs.com';
const DEFAULT_ALIYUN_SMS_COUNTRY_CODE = '86';
const DEFAULT_ALIYUN_SMS_SIGN_NAME = '速通互联验证码';
const DEFAULT_ALIYUN_SMS_TEMPLATE_CODE = '100001';
const DEFAULT_ALIYUN_SMS_TEMPLATE_PARAM = '{"code":"##code##","min":"5"}';
const DEFAULT_ALIYUN_SMS_CODE_LENGTH = 6;
const DEFAULT_ALIYUN_SMS_VALID_TIME_SECONDS = 300;
const DEFAULT_ALIYUN_SMS_DUPLICATE_POLICY = 1;
const DEFAULT_ALIYUN_SMS_INTERVAL_SECONDS = 60;
const DEFAULT_ALIYUN_SMS_CODE_TYPE = 1;
const DEFAULT_ALIYUN_SMS_CASE_AUTH_POLICY = 1;

type AppEnvironment = 'development' | 'test' | 'production';
type SmsAuthProvider = 'stub' | 'aliyun';
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

function parseSmsAuthProvider(
  value: string | undefined,
  env: AppEnvironment,
): SmsAuthProvider {
  if (value === 'stub' || value === 'aliyun') {
    return value;
  }

  if (env === 'production') {
    return 'aliyun';
  }

  return DEFAULT_SMS_AUTH_PROVIDER;
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
    smsAuth: {
      provider: parseSmsAuthProvider(process.env.SMS_AUTH_PROVIDER, env),
      aliyun: {
        accessKeyId: process.env.ALIYUN_SMS_ACCESS_KEY_ID ?? '',
        accessKeySecret: process.env.ALIYUN_SMS_ACCESS_KEY_SECRET ?? '',
        regionId:
          process.env.ALIYUN_SMS_REGION_ID ?? DEFAULT_ALIYUN_SMS_REGION_ID,
        endpoint:
          process.env.ALIYUN_SMS_ENDPOINT ?? DEFAULT_ALIYUN_SMS_ENDPOINT,
        countryCode:
          process.env.ALIYUN_SMS_COUNTRY_CODE ??
          DEFAULT_ALIYUN_SMS_COUNTRY_CODE,
        signName:
          process.env.ALIYUN_SMS_SIGN_NAME ?? DEFAULT_ALIYUN_SMS_SIGN_NAME,
        templateCode:
          process.env.ALIYUN_SMS_TEMPLATE_CODE ??
          DEFAULT_ALIYUN_SMS_TEMPLATE_CODE,
        templateParam:
          process.env.ALIYUN_SMS_TEMPLATE_PARAM ??
          DEFAULT_ALIYUN_SMS_TEMPLATE_PARAM,
        codeLength: parseNumber(
          process.env.ALIYUN_SMS_CODE_LENGTH,
          DEFAULT_ALIYUN_SMS_CODE_LENGTH,
        ),
        validTimeSeconds: parseNumber(
          process.env.ALIYUN_SMS_VALID_TIME_SECONDS,
          DEFAULT_ALIYUN_SMS_VALID_TIME_SECONDS,
        ),
        duplicatePolicy: parseNumber(
          process.env.ALIYUN_SMS_DUPLICATE_POLICY,
          DEFAULT_ALIYUN_SMS_DUPLICATE_POLICY,
        ),
        intervalSeconds: parseNonNegativeNumber(
          process.env.ALIYUN_SMS_INTERVAL_SECONDS,
          DEFAULT_ALIYUN_SMS_INTERVAL_SECONDS,
        ),
        codeType: parseNumber(
          process.env.ALIYUN_SMS_CODE_TYPE,
          DEFAULT_ALIYUN_SMS_CODE_TYPE,
        ),
        caseAuthPolicy: parseNumber(
          process.env.ALIYUN_SMS_CASE_AUTH_POLICY,
          DEFAULT_ALIYUN_SMS_CASE_AUTH_POLICY,
        ),
      },
    },
  };
};
