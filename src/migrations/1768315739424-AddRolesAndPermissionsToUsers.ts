import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddRolesAndPermissionsToUsers1768315739424
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types if they don't exist
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "admin_role_enum" AS ENUM (
          'super_admin',
          'admin',
          'operations_manager',
          'partner_manager',
          'finance_admin',
          'support'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "admin_permission_enum" AS ENUM (
          'view_dashboard',
          'view_requests',
          'create_request',
          'update_request',
          'delete_request',
          'assign_request',
          'escalate_request',
          'update_request_status',
          'view_workflows',
          'create_workflow',
          'update_workflow',
          'delete_workflow',
          'view_partners',
          'create_partner',
          'update_partner',
          'delete_partner',
          'suspend_partner',
          'activate_partner',
          'view_partner_performance',
          'manage_service_mapping',
          'view_finance',
          'process_payout',
          'view_payouts',
          'generate_reports',
          'view_users',
          'create_user',
          'update_user',
          'delete_user',
          'manage_system_settings',
          'view_system_logs',
          'manage_roles',
          'manage_permissions'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Check if columns already exist
    const table = await queryRunner.getTable('users');
    const rolesColumn = table?.findColumnByName('roles');
    const permissionsColumn = table?.findColumnByName('permissions');

    if (!rolesColumn) {
      await queryRunner.addColumn(
        'users',
        new TableColumn({
          name: 'roles',
          type: 'admin_role_enum',
          isArray: true,
          default: "'{}'",
          isNullable: true,
        }),
      );
    }

    if (!permissionsColumn) {
      await queryRunner.addColumn(
        'users',
        new TableColumn({
          name: 'permissions',
          type: 'admin_permission_enum',
          isArray: true,
          default: "'{}'",
          isNullable: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('users');
    const rolesColumn = table?.findColumnByName('roles');
    const permissionsColumn = table?.findColumnByName('permissions');

    if (rolesColumn) {
      await queryRunner.dropColumn('users', 'roles');
    }

    if (permissionsColumn) {
      await queryRunner.dropColumn('users', 'permissions');
    }

    // Drop enum types (only if no other columns are using them)
    await queryRunner.query(`
      DROP TYPE IF EXISTS "admin_permission_enum" CASCADE;
    `);

    await queryRunner.query(`
      DROP TYPE IF EXISTS "admin_role_enum" CASCADE;
    `);
  }
}
