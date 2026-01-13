import { Injectable, Logger } from '@nestjs/common';
import { UserRepository } from '../../repositories/user.repository';
import { AdminRole } from '../../@common/constants/role.constant';

@Injectable()
export class AdminUserSeeder {
  private readonly logger = new Logger(AdminUserSeeder.name);

  constructor(private readonly userRepository: UserRepository) {}

  async seed() {
    this.logger.log('Starting admin user seeding...');

    // Get admin email from environment or use default
    const adminEmail =
      process.env.ADMIN_EMAIL || 'admin@bizvantage.com';

    const user = await this.userRepository.findByEmail(adminEmail);

    if (!user) {
      this.logger.warn(
        `Admin user with email ${adminEmail} not found. Please create the user first or set ADMIN_EMAIL environment variable.`,
      );
      return;
    }

    // Check if user already has admin roles
    const hasAdminRole =
      user.roles &&
      user.roles.some((role) => Object.values(AdminRole).includes(role));

    if (hasAdminRole) {
      this.logger.log(
        `User ${adminEmail} already has admin roles: ${user.roles?.join(', ')}`,
      );
      return;
    }

    // Assign Super Admin role
    await this.userRepository
      .createQueryBuilder()
      .update()
      .set({
        roles: [AdminRole.SUPER_ADMIN],
      })
      .where('email = :email', { email: adminEmail })
      .execute();

    this.logger.log(
      `Successfully assigned Super Admin role to user: ${adminEmail}`,
    );
  }
}
