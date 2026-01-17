import { Injectable, Logger } from '@nestjs/common';
import { UserRepository } from '../../repositories/user.repository';
import { AdminRole } from '../../@common/constants/role.constant';
import { Status } from '../../@common/constants/status.constant';
import { randomBytes } from 'crypto';

@Injectable()
export class AdminUserSeeder {
  private readonly logger = new Logger(AdminUserSeeder.name);

  constructor(private readonly userRepository: UserRepository) {}

  private generateStrongPassword(): string {
    
    const suffix = randomBytes(18).toString('base64url');
    return `A1!${suffix}`;
  }

  async seed() {
    this.logger.log('Starting admin user seeding...');

    // Get admin email from environment or use default
    const adminEmail =
      process.env.ADMIN_EMAIL || 'admin@bizvantage.com';

    const user = await this.userRepository.findByEmail(adminEmail);

    if (!user) {
      const envPassword = process.env.ADMIN_PASSWORD;
      const password = envPassword || this.generateStrongPassword();

      await this.userRepository.createStrict({
        email: adminEmail,
        password,
        status: Status.ACTIVE,
        signUpDate: new Date(),
        emailVerifiedAt: new Date(),
        isGuest: false,
        isProfileComplete: true,
        roles: [AdminRole.SUPER_ADMIN],
      } as any);

      if (!envPassword) {
        this.logger.warn(
          `Created admin user ${adminEmail} with generated password: ${password}. Set ADMIN_PASSWORD to control this and change it immediately after first login.`,
        );
      } else {
        this.logger.log(`Created admin user ${adminEmail} using ADMIN_PASSWORD env var.`);
      }

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
