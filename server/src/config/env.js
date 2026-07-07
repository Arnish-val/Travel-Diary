'use strict';
require('dotenv').config();

const Joi = require('joi');

const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(5000),

  DATABASE_URL: Joi.string().uri().required(),
  POSTGRES_USER: Joi.string().required(),
  POSTGRES_PASSWORD: Joi.string().required(),
  POSTGRES_DB: Joi.string().required(),
  POSTGRES_HOST: Joi.string().default('localhost'),
  POSTGRES_PORT: Joi.number().default(5432),

  JWT_ACCESS_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_EXPIRY: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRY: Joi.string().default('30d'),

  REDIS_URL: Joi.string().default('redis://localhost:6379'),

  S3_ENDPOINT: Joi.string().required(),
  S3_ACCESS_KEY: Joi.string().required(),
  S3_SECRET_KEY: Joi.string().required(),
  S3_BUCKET: Joi.string().required(),
  S3_REGION: Joi.string().default('us-east-1'),
  S3_PUBLIC_URL: Joi.string().required(),

  MAX_FILE_SIZE_MB: Joi.number().default(15),
  MAX_FILES_PER_TRIP: Joi.number().default(50),
  USER_STORAGE_QUOTA_GB: Joi.number().default(5),

  RATE_LIMIT_WINDOW_MS: Joi.number().default(60000),
  RATE_LIMIT_MAX: Joi.number().default(100),
  AUTH_RATE_LIMIT_MAX: Joi.number().default(5),

  CLIENT_URL: Joi.string().default('http://localhost:5173'),
  LOG_LEVEL: Joi.string().default('info'),
}).unknown(true);

const { error, value: env } = envSchema.validate(process.env);
if (error) {
  throw new Error(`Environment validation error: ${error.message}`);
}

module.exports = env;
