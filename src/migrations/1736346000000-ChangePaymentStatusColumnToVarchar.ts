import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangePaymentStatusColumnToVarchar1736346000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
   
    await queryRunner.query(`
      ALTER TABLE orders 
      ALTER COLUMN payment_status TYPE varchar(100) 
      USING payment_status::text
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
   
    await queryRunner.query(`
      ALTER TABLE orders 
      ALTER COLUMN payment_status TYPE varchar(100)
    `);
  }
}

