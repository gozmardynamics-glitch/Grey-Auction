/**
 * Integration-test DB provisioning (P2). Connects to the admin database
 * (DB creds from env), drops + recreates the target test DB, then applies
 * all TypeORM migrations. Run before the integration suite:
 *
 *   DB_DATABASE=greyauction_itest npx ts-node scripts/itest-db-setup.ts
 *
 * Requires DB creds via env (DB_HOST/DB_PORT/DB_USERNAME/DB_PASSWORD).
 */
import { Client } from 'pg';
import { DataSource } from 'typeorm';
import { dataSourceOptions } from '../src/config/database.config';

const ADMIN_DB = process.env.ITEST_ADMIN_DB || "greyauction";
const TARGET_DB = process.env.DB_DATABASE || "greyauction_itest";

async function main(): Promise<void> {
  const admin = new Client({
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432", 10),
    user: process.env.DB_USERNAME || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
    database: ADMIN_DB,
  });
  await admin.connect();
  await admin.query(`DROP DATABASE IF EXISTS "${TARGET_DB}" WITH (FORCE)`);
  await admin.query(`CREATE DATABASE "${TARGET_DB}"`);
  await admin.end();
  console.log("Created database: " + TARGET_DB);

  const ds = new DataSource({
    ...dataSourceOptions,
    database: TARGET_DB,
    synchronize: false,
    migrationsRun: false,
  } as any);
  await ds.initialize();
  const applied = await ds.runMigrations();
  await ds.destroy();
  console.log("Applied " + applied.length + " migration(s): " + applied.map((m) => m.name).join(", "));
}

main().catch((e) => {
  console.error("itest DB setup failed:", e);
  process.exitCode = 1;
});
