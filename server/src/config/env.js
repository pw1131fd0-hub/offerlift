import 'dotenv/config';

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  databaseUrl: process.env.DATABASE_URL || 'postgres://offerlift:offerlift_dev_password@localhost:5432/offerlift',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  apiKey: process.env.API_KEY || 'dev_api_key_12345',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:3000',
};
