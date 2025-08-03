import 'reflect-metadata';
import { DataSource } from 'typeorm';
import config from './config';
import entity from './entity';

const sqlConfig: any = {
  type: 'mysql',
  host: config.DB_HOST,
  port: Number(config.DB_PORT),
  username: config.DB_USERNAME,
  password: config.DB_PASSWORD,
  database: config.DB_NAME,
  synchronize: true,
  logging: false,
  ssl: false,
  entities: entity,
  migrations: [],
  subscribers: []
};

const AppDataSource = new DataSource(sqlConfig);

export default AppDataSource;
