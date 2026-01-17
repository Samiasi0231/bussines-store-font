import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePartnersTable1768340000000 implements MigrationInterface {
  name = 'CreatePartnersTable1768340000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "partners" (
        "id" uuid NOT NULL,
        "partner_no" SERIAL NOT NULL,
        "code" character varying(20),
        "name" character varying(255) NOT NULL,
        "email" character varying(255) NOT NULL,
        "phone" character varying(50),
        "city" character varying(100),
        "state" character varying(100),
        "country" character varying(100),
        "services" text[],
        "rating" numeric(3,1) NOT NULL DEFAULT 0,
        "status" character varying(50) NOT NULL DEFAULT 'pending',
        "created_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "updated_at" timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        "deleted_at" timestamptz,
        CONSTRAINT "PK_partners_id" PRIMARY KEY ("id")
      );
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_partners_partner_no" ON "partners" ("partner_no");
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_partners_code" ON "partners" ("code");
    `);
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_partners_email" ON "partners" ("email");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_partners_status" ON "partners" ("status");
    `);
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_partners_name" ON "partners" ("name");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_partners_name";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_partners_status";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_partners_email";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_partners_code";`);
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_partners_partner_no";`);
    await queryRunner.query(`DROP TABLE IF EXISTS "partners";`);
  }
}

