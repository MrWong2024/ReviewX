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

const llmRealEnabledSchema = Joi.boolean()
  .truthy('true')
  .truthy('1')
  .falsy('false')
  .falsy('0')
  .default(false);

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
    otherwise: mongoUriSchema.allow('').optional(),
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
  LLM_PROVIDER: llmProviderSchema,
  LLM_REAL_ENABLED: llmRealEnabledSchema,
  BAILIAN_API_KEY: Joi.when('NODE_ENV', {
    is: 'production',
    then: Joi.when('LLM_PROVIDER', {
      is: 'bailian',
      then: Joi.when('LLM_REAL_ENABLED', {
        is: true,
        then: Joi.string().trim().min(1).required(),
        otherwise: Joi.string().trim().allow('').default(''),
      }),
      otherwise: Joi.string().trim().allow('').default(''),
    }),
    otherwise: Joi.string().trim().allow('').default(''),
  }),
  BAILIAN_BASE_URL: Joi.string()
    .trim()
    .uri({ scheme: ['http', 'https'] })
    .default('https://dashscope.aliyuncs.com/compatible-mode/v1'),
  BAILIAN_MODEL: Joi.string().trim().min(1).default('qwen3.6-plus'),
  BAILIAN_TIMEOUT_MS: Joi.number().integer().min(1).default(90000),
  BAILIAN_MAX_RETRIES: Joi.number().integer().min(0).default(1),
})
  .unknown(true)
  .options({ abortEarly: false });
