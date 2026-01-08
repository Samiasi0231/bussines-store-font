import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddProviderReferenceToCheckoutPayments1736342568000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if the column already exists
    const table = await queryRunner.getTable('checkout_payments');
    const providerReferenceColumn = table?.findColumnByName('provider_reference');

    if (!providerReferenceColumn) {
      await queryRunner.addColumn(
        'checkout_payments',
        new TableColumn({
          name: 'provider_reference',
          type: 'varchar',
          isNullable: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Check if the column exists before removing it
    const table = await queryRunner.getTable('checkout_payments');
    const providerReferenceColumn = table?.findColumnByName('provider_reference');

    if (providerReferenceColumn) {
      await queryRunner.dropColumn('checkout_payments', 'provider_reference');
    }
  }
}

