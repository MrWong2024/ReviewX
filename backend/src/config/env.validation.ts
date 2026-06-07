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
})
  .unknown(true)
  .options({ abortEarly: false });
