import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddTransactionIdToOrdersAndCheckoutPayments1767885996265
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add transaction_id to orders table
    const ordersTable = await queryRunner.getTable('orders');
    const ordersTransactionIdColumn = ordersTable?.findColumnByName('transaction_id');

    if (!ordersTransactionIdColumn) {
      await queryRunner.addColumn(
        'orders',
        new TableColumn({
          name: 'transaction_id',
          type: 'uuid',
          isNullable: true,
        }),
      );

      // Create index for transaction_id
      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS "IDX_orders_transaction_id" ON "orders" ("transaction_id")
      `);
    }

    // Add transaction_id to checkout_payments table
    const checkoutPaymentsTable = await queryRunner.getTable('checkout_payments');
    const checkoutPaymentsTransactionIdColumn = checkoutPaymentsTable?.findColumnByName('transaction_id');

    if (!checkoutPaymentsTransactionIdColumn) {
      await queryRunner.addColumn(
        'checkout_payments',
        new TableColumn({
          name: 'transaction_id',
          type: 'uuid',
          isNullable: true,
        }),
      );

      // Create index for transaction_id
      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS "IDX_checkout_payments_transaction_id" ON "checkout_payments" ("transaction_id")
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove transaction_id from checkout_payments table
    const checkoutPaymentsTable = await queryRunner.getTable('checkout_payments');
    const checkoutPaymentsTransactionIdColumn = checkoutPaymentsTable?.findColumnByName('transaction_id');

    if (checkoutPaymentsTransactionIdColumn) {
      await queryRunner.query(`
        DROP INDEX IF EXISTS "IDX_checkout_payments_transaction_id"
      `);
      await queryRunner.dropColumn('checkout_payments', 'transaction_id');
    }

    // Remove transaction_id from orders table
    const ordersTable = await queryRunner.getTable('orders');
    const ordersTransactionIdColumn = ordersTable?.findColumnByName('transaction_id');

    if (ordersTransactionIdColumn) {
      await queryRunner.query(`
        DROP INDEX IF EXISTS "IDX_orders_transaction_id"
      `);
      await queryRunner.dropColumn('orders', 'transaction_id');
    }
  }
}

