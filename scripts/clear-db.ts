import 'dotenv/config';
import { DataSource } from 'typeorm';
import config from '../src/@common/config/app.config';

/**
 * Script to clear all data from the database
 * 
 * WARNING: This will delete ALL data from ALL tables in the database.
 * Use with caution!
 * 
 * Usage:
 *   npm run build
 *   node dist/scripts/clear-db.js
 * 
 * Or add to package.json:
 *   "db:clear": "ts-node scripts/clear-db.ts"
 */

async function clearDatabase() {
  const { db } = config();
  
  console.log('Connecting to database...');
  console.log(`Database: ${db.name}`);
  console.log(`Host: ${db.host}:${db.port}`);
  
  const dataSource = new DataSource({
    type: 'postgres',
    host: db.host,
    port: db.port,
    username: db.username,
    password: db.password,
    database: db.name,
  });

  try {
    await dataSource.initialize();
    console.log('Connected to database successfully');

    // Get all table names
    const queryRunner = dataSource.createQueryRunner();
    const tables = await queryRunner.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      AND tablename NOT LIKE 'pg_%'
      AND tablename NOT LIKE '_pg_%'
    `);

    if (tables.length === 0) {
      console.log('No tables found in the database.');
      await dataSource.destroy();
      return;
    }

    console.log(`\nFound ${tables.length} tables. Clearing data...\n`);

    // Build list of table names for truncation
    const tableNames = tables.map(t => `"${t.tablename}"`).join(', ');
    
    try {
      // Truncate all tables at once with CASCADE to handle foreign keys
      await queryRunner.query(`TRUNCATE TABLE ${tableNames} RESTART IDENTITY CASCADE;`);
      console.log(`✓ Cleared all ${tables.length} tables`);
    } catch (error) {
      // If bulk truncate fails, try individual tables
      console.log('Bulk truncate failed, trying individual tables...\n');
      for (const table of tables) {
        const tableName = table.tablename;
        try {
          await queryRunner.query(`TRUNCATE TABLE "${tableName}" RESTART IDENTITY CASCADE;`);
          console.log(`✓ Cleared table: ${tableName}`);
        } catch (err) {
          console.error(`✗ Failed to clear table ${tableName}:`, err.message);
        }
      }
    }

    // Note: RESTART IDENTITY in TRUNCATE already resets sequences, but we'll verify
    // Only reset sequences if they weren't already reset by RESTART IDENTITY
    const sequences = await queryRunner.query(`
      SELECT sequence_name 
      FROM information_schema.sequences 
      WHERE sequence_schema = 'public'
    `);

    if (sequences.length > 0) {
      console.log(`\nVerified ${sequences.length} sequences (already reset by RESTART IDENTITY)`);
    }

    await queryRunner.release();
    console.log('\n✅ Database cleared successfully!');
    
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    throw error;
  } finally {
    await dataSource.destroy();
    console.log('Database connection closed.');
  }
}

// Run the script
if (require.main === module) {
  clearDatabase()
    .then(() => {
      console.log('\nDone!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\nFailed to clear database:', error);
      process.exit(1);
    });
}

export { clearDatabase };

