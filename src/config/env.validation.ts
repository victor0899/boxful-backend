import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  PORT: Joi.number().default(3001),

  DATABASE_URL: Joi.string().required().messages({
    'string.empty': 'DATABASE_URL is required',
    'any.required': 'DATABASE_URL must be provided in environment variables',
  }),

  JWT_SECRET: Joi.string().min(10).required().messages({
    'string.min': 'JWT_SECRET must be at least 10 characters long',
    'string.empty': 'JWT_SECRET is required',
    'any.required': 'JWT_SECRET must be provided in environment variables',
  }),

  RESEND_API_KEY: Joi.string().required().messages({
    'string.empty': 'RESEND_API_KEY is required',
    'any.required':
      'RESEND_API_KEY must be provided for email verification',
  }),

  FRONTEND_URL: Joi.string().uri().optional().messages({
    'string.uri': 'FRONTEND_URL must be a valid URI',
  }),
});
