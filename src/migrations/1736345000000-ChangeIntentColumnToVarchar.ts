import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class ChangeIntentColumnToVarchar1736345000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    
    await queryRunner.query(`
      ALTER TABLE checkout_payments 
      ALTER COLUMN intent TYPE varchar(100) 
      USING intent::text
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE checkout_payments 
      ALTER COLUMN intent TYPE varchar(100)
    `);
  }
}

