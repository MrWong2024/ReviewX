import Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  PORT: Joi.number().port().default(5001),
  FRONTEND_URL: Joi.string().trim().min(1).default('http://localhost:3001'),
  CORS_ORIGIN: Joi.string().trim().min(1).default('http://localhost:3001'),
  MONGO_URI: Joi.string()
    .pattern(/^mongodb(\+srv)?:\/\/\S+$/)
    .allow('')
    .optional()
    .messages({
      'string.pattern.base':
        'MONGO_URI must start with mongodb:// or mongodb+srv://',
    }),
})
  .unknown(true)
  .options({ abortEarly: false });
