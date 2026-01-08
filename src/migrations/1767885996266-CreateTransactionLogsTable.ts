import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateTransactionLogsTable1767885996266
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('transaction_logs');
    if (table) {
      return;
    }

    await queryRunner.createTable(
      new Table({
        name: 'transaction_logs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()',
          },
          {
            name: 'transaction_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'entity_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'entity_type',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'amount',
            type: 'bigint',
            isNullable: true,
          },
          {
            name: 'message',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP(6)',
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP(6)',
          },
          {
            name: 'deleted_at',
            type: 'timestamptz',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // Create indexes
    await queryRunner.createIndex(
      'transaction_logs',
      new TableIndex({
        name: 'IDX_transaction_logs_transaction_id',
        columnNames: ['transaction_id'],
      }),
    );

    await queryRunner.createIndex(
      'transaction_logs',
      new TableIndex({
        name: 'IDX_transaction_logs_entity_id_entity_type',
        columnNames: ['entity_id', 'entity_type'],
      }),
    );

    await queryRunner.createIndex(
      'transaction_logs',
      new TableIndex({
        name: 'IDX_transaction_logs_created_at',
        columnNames: ['created_at'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('transaction_logs');
    if (table) {
      await queryRunner.dropTable('transaction_logs');
    }
  }
}

