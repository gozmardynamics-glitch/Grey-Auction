import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';
import { resolve } from 'path';

config();

const isProduction = process.env.NODE_ENV === 'production';
// C1 mitigation: a one-time schema bootstrap for the FIRST production deploy.
// Set DB_SYNCHRONIZE=true once to create all tables from entities, then remove
// it and rely on migrations (a full baseline migration is the follow-up).
const bootstrapSync = process.env.DB_SYNCHRONIZE === 'true';

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'greyauction',
  entities: [resolve(__dirname, '..', '**', '*.entity.{ts,js}')],
  migrations: [resolve(__dirname, '..', 'database', 'migrations', '*.{ts,js}')],
  synchronize: bootstrapSync || !isProduction,
  migrationsRun: isProduction && !bootstrapSync,
  logging: process.env.NODE_ENV === 'development',
  extra: {
    max: parseInt(process.env.DB_POOL_SIZE || '20', 10),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  },
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
