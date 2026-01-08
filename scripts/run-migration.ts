import 'dotenv/config';
import { DataSource } from 'typeorm';
import config from '../src/@common/config/app.config';
import { Logger } from '@nestjs/common';

const { db } = config();

const MigrationDataSource = new DataSource({
  type: 'postgres',
  host: db.host,
  port: db.port,
  username: db.username,
  password: db.password,
  database: db.name,
  migrations: ['dist/migrations/*.js'],
  synchronize: false, 
  logging: true,
});

async function runMigrations() {
  try {
    Logger.log('Initializing database connection...');
    await MigrationDataSource.initialize();

    Logger.log('Running migrations...');
    const migrations = await MigrationDataSource.runMigrations();
    
    if (migrations.length === 0) {
      Logger.log('No pending migrations found.');
    } else {
      Logger.log(`✓ Successfully ran ${migrations.length} migration(s):`);
      migrations.forEach((migration) => {
        Logger.log(`  - ${migration.name}`);
      });
    }

    await MigrationDataSource.destroy();
    Logger.log('Migrations completed successfully');
    process.exit(0);
  } catch (error) {
    Logger.error('Migration failed:', error);
    if (MigrationDataSource.isInitialized) {
      await MigrationDataSource.destroy();
    }
    process.exit(1);
  }
}

runMigrations();

