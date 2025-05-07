import * as dotenv from 'dotenv';

const env = process.env.NODE_ENV.replace(/\s+/g, '') || 'local';

const envFilePath = '.env';

dotenv.config({ path: envFilePath });

const config = {
  NODE_ENV: env,
  PORT: process.env.PORT,
  HOST: process.env.HOST,
  DB_URL: process.env.DB_URL,
  API_BASE_PATH: process.env.API_BASE_PATH,
  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET,
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,
  ACCESS_TOKEN_EXPIRATION_TIME: process.env.ACCESS_TOKEN_EXPIRATION_TIME,
  REFRESH_TOKEN_EXPIRATION_TIME: process.env.REFRESH_TOKEN_EXPIRATION_TIME,
  SWAGGER_USERNAME: process.env.SWAGGER_USERNAME,
  SWAGGER_PASSWORD: process.env.SWAGGER_PASSWORD
};

export default config;
