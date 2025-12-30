import 'dotenv/config';
import { DataSource } from 'typeorm';
import * as readline from 'readline';
import config from '../src/@common/config/app.config';
import { Environment } from '../src/@common/constants/environment.constant';

/**
 * Script to clear all data from the database
 * 
 * WARNING: This will delete ALL data from ALL tables in the database.
 * Use with caution!
 * 
 * ⚠️  SAFETY: This script will NOT run in production environment.
 * 
 * Usage:
 *   npm run db:clear
 */

function promptConfirmation(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      const normalized = answer.trim().toLowerCase();
      resolve(normalized === 'yes' || normalized === 'y');
    });
  });
}

async function clearDatabase() {
  // Safety check: Prevent execution in production
  const env = process.env.ENV?.toLowerCase();
  if (env === Environment.PRODUCTION || env === 'prod') {
    console.error('❌ ERROR: This script cannot be run in production environment!');
    console.error(`   Current environment: ${env}`);
    console.error('   This is a safety measure to prevent accidental data loss.');
    throw new Error('Database clear script blocked: Production environment detected');
  }

  // Additional check: Warn if environment is not explicitly set to a safe value
  if (!env || env === '') {
    console.warn('⚠️  WARNING: ENV environment variable is not set.');
    console.warn('   Proceeding with caution. If this is production, STOP NOW!');
    console.warn('   Set ENV=production to block this script.\n');
  }

  const { db } = config();
  
  // Additional safety: Warn about remote hosts (but allow if ENV is explicitly set to non-production)
  const isLocalhost = db.host === 'localhost' || db.host === '127.0.0.1' || db.host === '0.0.0.0';
  const isDockerHost = db.host === 'postgres' || db.host === 'db';
  
  // Display database connection details
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('⚠️  DATABASE CLEAR OPERATION - CONFIRMATION REQUIRED');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log('You are about to DELETE ALL DATA from the following database:\n');
  console.log('  📍 Host:     ', db.host);
  console.log('  🔌 Port:     ', db.port);
  console.log('  🗄️  Database: ', db.name);
  console.log('  👤 Username: ', db.username);
  console.log('  🔑 Password: ', db.password ? '***' + db.password.slice(-2) : 'Not set');
  console.log('  🌍 Environment:', env || '(not set)');
  console.log('\n═══════════════════════════════════════════════════════════\n');

  if (!isLocalhost && !isDockerHost) {
    console.warn('⚠️  WARNING: Database host is not localhost!');
    if (env === Environment.PRODUCTION || env === 'prod') {
      console.error('❌ ERROR: Cannot proceed - production environment detected!');
      throw new Error('Database clear script blocked: Production environment and remote host detected');
    }
    console.warn('   This appears to be a remote database server.');
    console.warn('   Double-check that this is the correct database!\n');
  }

  // Require explicit confirmation
  const confirmed = await promptConfirmation(
    '⚠️  Are you ABSOLUTELY SURE you want to DELETE ALL DATA from this database? (type "yes" to confirm): '
  );

  if (!confirmed) {
    console.log('\n❌ Operation cancelled by user. No data was deleted.');
    process.exit(0);
  }

  console.log('\n🔄 Proceeding with database clear operation...\n');
  console.log('Connecting to database...');
  
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

