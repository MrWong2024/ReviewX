import Joi from 'joi';

const mongoUriSchema = Joi.string()
  .trim()
  .pattern(/^mongodb(\+srv)?:\/\/\S+$/)
  .messages({
    'string.pattern.base':
      'MONGO_URI must start with mongodb:// or mongodb+srv://',
  });

const mongoAutoIndexSchema = Joi.boolean()
  .truthy('true')
  .truthy('1')
  .falsy('false')
  .falsy('0');

const llmProviderSchema = Joi.string().valid('stub', 'bailian').default('stub');
const smsAuthProviderSchema = Joi.when('NODE_ENV', {
  is: 'production',
  then: Joi.string().valid('stub', 'aliyun').default('aliyun'),
  otherwise: Joi.string().valid('stub', 'aliyun').default('stub'),
});
const booleanSchema = Joi.boolean()
  .truthy('true')
  .truthy('1')
  .falsy('false')
  .falsy('0');

type SessionEnvCandidate = {
  SESSION_COOKIE_SAME_SITE?: unknown;
  SESSION_COOKIE_SECURE?: unknown;
};

function validateSessionCookieCombination(
  value: unknown,
  helpers: Joi.CustomHelpers,
): unknown {
  const candidate = value as SessionEnvCandidate;

  if (
    candidate.SESSION_COOKIE_SAME_SITE === 'none' &&
    candidate.SESSION_COOKIE_SECURE !== true
  ) {
    return helpers.error('any.invalid');
  }

  return value;
}

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  PORT: Joi.number().port().default(5001),
  FRONTEND_URL: Joi.string().trim().min(1).default('http://localhost:3001'),
  CORS_ORIGIN: Joi.string().trim().min(1).default('http://localhost:3001'),
  MONGO_URI: Joi.when('NODE_ENV', {
    is: 'production',
    then: mongoUriSchema.required(),
    otherwise: Joi.when('NODE_ENV', {
      is: 'test',
      then: mongoUriSchema.default(
        'mongodb://reviewx_test_app:{REVIEWX_TEST_APP_PASSWORD}@127.0.0.1:27017/reviewx_test?authSource=reviewx_test',
      ),
      otherwise: mongoUriSchema.default(
        'mongodb://reviewx_dev_app:{REVIEWX_DEV_APP_PASSWORD}@127.0.0.1:27017/reviewx_dev?authSource=reviewx_dev',
      ),
    }),
  }),
  MONGO_ADMIN_URI: Joi.when('NODE_ENV', {
    is: 'production',
    then: mongoUriSchema.required(),
    otherwise: Joi.when('NODE_ENV', {
      is: 'test',
      then: mongoUriSchema.default(
        'mongodb://reviewx_test_db_admin:{REVIEWX_TEST_DB_ADMIN_PASSWORD}@127.0.0.1:27017/reviewx_test?authSource=reviewx_test',
      ),
      otherwise: mongoUriSchema.default(
        'mongodb://reviewx_dev_db_admin:{REVIEWX_DEV_DB_ADMIN_PASSWORD}@127.0.0.1:27017/reviewx_dev?authSource=reviewx_dev',
      ),
    }),
  }),
  MONGO_AUTO_INDEX: Joi.when('NODE_ENV', {
    is: 'production',
    then: mongoAutoIndexSchema.valid(false).default(false),
    otherwise: mongoAutoIndexSchema.optional(),
  }),
  MONGO_SERVER_SELECTION_TIMEOUT_MS: Joi.number()
    .integer()
    .min(1)
    .default(5000),
  SESSION_COOKIE_NAME: Joi.string().trim().min(1).default('reviewx_session'),
  SESSION_TTL_MS: Joi.number().integer().min(1).default(86400000),
  MAX_ACTIVE_SESSIONS_PER_USER: Joi.number().integer().min(1).default(5),
  SESSION_COOKIE_SECURE: Joi.when('NODE_ENV', {
    is: 'production',
    then: booleanSchema.valid(true).default(true),
    otherwise: booleanSchema.default(false),
  }),
  SESSION_COOKIE_SAME_SITE: Joi.string()
    .valid('lax', 'strict', 'none')
    .default('lax'),
  LLM_PROVIDER: llmProviderSchema,
  BAILIAN_API_KEY: Joi.string().trim().allow('').default(''),
  BAILIAN_BASE_URL: Joi.string()
    .trim()
    .allow('')
    .uri({ scheme: ['http', 'https'] })
    .default('https://dashscope.aliyuncs.com/compatible-mode/v1'),
  BAILIAN_MODEL: Joi.string().trim().allow('').default(''),
  BAILIAN_TIMEOUT_MS: Joi.number().integer().min(1).default(90000),
  BAILIAN_MAX_RETRIES: Joi.number().integer().min(0).default(1),
  CONSENSUS_DRAFT_COOLDOWN_SECONDS: Joi.number()
    .integer()
    .min(0)
    .default(60),
  SMS_AUTH_PROVIDER: smsAuthProviderSchema,
  ALIYUN_SMS_ACCESS_KEY_ID: Joi.string().trim().allow('').default(''),
  ALIYUN_SMS_ACCESS_KEY_SECRET: Joi.string().trim().allow('').default(''),
  ALIYUN_SMS_REGION_ID: Joi.string().trim().min(1).default('cn-shenzhen'),
  ALIYUN_SMS_ENDPOINT: Joi.string()
    .trim()
    .min(1)
    .default('dypnsapi.aliyuncs.com'),
  ALIYUN_SMS_COUNTRY_CODE: Joi.string().trim().valid('86').default('86'),
  ALIYUN_SMS_SIGN_NAME: Joi.string()
    .trim()
    .min(1)
    .default('速通互联验证码'),
  ALIYUN_SMS_TEMPLATE_CODE: Joi.string().trim().min(1).default('100001'),
  ALIYUN_SMS_TEMPLATE_PARAM: Joi.string()
    .trim()
    .min(1)
    .default('{"code":"##code##","min":"5"}'),
  ALIYUN_SMS_CODE_LENGTH: Joi.number().integer().min(4).max(8).default(6),
  ALIYUN_SMS_VALID_TIME_SECONDS: Joi.number().integer().min(1).default(300),
  ALIYUN_SMS_DUPLICATE_POLICY: Joi.number().integer().valid(1, 2).default(1),
  ALIYUN_SMS_INTERVAL_SECONDS: Joi.number().integer().min(0).default(60),
  ALIYUN_SMS_CODE_TYPE: Joi.number().integer().min(1).max(7).default(1),
  ALIYUN_SMS_CASE_AUTH_POLICY: Joi.number().integer().valid(1, 2).default(1),
})
  .custom(validateSessionCookieCombination)
  .unknown(true)
  .options({ abortEarly: false });
