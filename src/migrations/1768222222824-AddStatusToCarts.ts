import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddStatusToCarts1768222222824 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const cartsTable = await queryRunner.getTable('carts');
    

    const statusColumn = cartsTable?.findColumnByName('status');
    if (!statusColumn) {

      await queryRunner.query(`
        DO $$ BEGIN
          CREATE TYPE "cart_status_enum" AS ENUM ('active', 'converted', 'expired');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);
      
      await queryRunner.query(`
        ALTER TABLE carts 
        ADD COLUMN IF NOT EXISTS status "cart_status_enum" NOT NULL DEFAULT 'active'
      `);


      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS "IDX_carts_status" ON "carts" ("status")
      `);


      await queryRunner.query(`
        UPDATE carts SET status = 'active' WHERE status IS NULL
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const cartsTable = await queryRunner.getTable('carts');
    

    const statusColumn = cartsTable?.findColumnByName('status');
    if (statusColumn) {
      await queryRunner.query(`
        DROP INDEX IF EXISTS "IDX_carts_status"
      `);
      await queryRunner.dropColumn('carts', 'status');
      await queryRunner.query(`DROP TYPE IF EXISTS "cart_status_enum"`);
    }
  }
}
