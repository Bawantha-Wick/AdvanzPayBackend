import * as dotenv from 'dotenv';

const env = process.env.NODE_ENV.replace(/\s+/g, '') || 'local';

const envFilePath = '.env';

dotenv.config({ path: envFilePath });

const config = {
  NODE_ENV: env,
  PORT: parseInt(process.env.PORT, 10),
  HOST: process.env.HOST,
  DB_HOST: process.env.DB_HOST,
  DB_PORT: parseInt(process.env.DB_PORT, 10),
  DB_USERNAME: process.env.DB_USERNAME,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_NAME: process.env.DB_NAME,
  API_BASE_PATH: process.env.API_BASE_PATH,
  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET,
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
  ACCESS_TOKEN_EXPIRATION_TIME: process.env.ACCESS_TOKEN_EXPIRATION_TIME,
  REFRESH_TOKEN_EXPIRATION_TIME: process.env.REFRESH_TOKEN_EXPIRATION_TIME,
  SWAGGER_USERNAME: process.env.SWAGGER_USERNAME,
  SWAGGER_PASSWORD: process.env.SWAGGER_PASSWORD
};

export default config;
