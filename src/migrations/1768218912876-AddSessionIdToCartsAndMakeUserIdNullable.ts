import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddSessionIdToCartsAndMakeUserIdNullable1768218912876
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const cartsTable = await queryRunner.getTable('carts');
    

    const userIdColumn = cartsTable?.findColumnByName('user_id');
    if (userIdColumn && !userIdColumn.isNullable) {
      await queryRunner.query(`
        ALTER TABLE carts 
        ALTER COLUMN user_id DROP NOT NULL
      `);
    }


    const sessionIdColumn = cartsTable?.findColumnByName('session_id');
    if (!sessionIdColumn) {
      await queryRunner.addColumn(
        'carts',
        new TableColumn({
          name: 'session_id',
          type: 'varchar',
          length: '255',
          isNullable: true,
        }),
      );


      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS "IDX_carts_session_id" ON "carts" ("session_id")
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const cartsTable = await queryRunner.getTable('carts');
    

    const sessionIdColumn = cartsTable?.findColumnByName('session_id');
    if (sessionIdColumn) {
      await queryRunner.query(`
        DROP INDEX IF EXISTS "IDX_carts_session_id"
      `);
      await queryRunner.dropColumn('carts', 'session_id');
    }

 
    await queryRunner.query(`
      ALTER TABLE carts 
      ALTER COLUMN user_id SET NOT NULL
    `);
  }
}
