import { Injectable } from '@nestjs/common';
import { UserRepository } from '../repositories/user.repository';
import { UserSanitizer } from './sanitizers/user.sanitizer';
import { CacheService } from '../@common/cache/cache.service';
import {
  CachedUserProfileData,
  UserDataForProfile,
} from './interfaces/user.interface';
import { ResponseService } from '../@common/response';
import { UUID } from 'crypto';
import {
  SuccessMessage,
  ErrorMessage,
} from '../@common/constants/message.constant';
import { EditUserProfileDTO, UpdateUserProfileDTO } from './dtos/user.dto';
import { KycRepository } from '../repositories/kyc.repository';
import { DbTransactionManager } from '../@common/database/database-transaction.manager';
import { Kyc } from '../entities/kyc.entity';
import { WalletService } from '../wallet/wallet.service';
import { Tier } from '../@common/constants/tier.constant';
import { User } from '../entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly kycRepository: KycRepository,
    private readonly userSanitizer: UserSanitizer,
    private readonly cacheService: CacheService,
    private readonly responseService: ResponseService,
    private readonly dbTransactionManager: DbTransactionManager,
    private readonly walletService: WalletService,
  ) {}

  async getProfile(userId: UUID) {
    const cachedUser = await this.getCachedUserData(userId);

    if (cachedUser) {
      const data = this.userSanitizer.sanitizeCachedUserData(cachedUser);
      return this.responseService.sendSuccess(
        SuccessMessage.OPERATION_SUCCESSFUL,
        data,
      );
    }

    const user = await this.userRepository.findById(userId);

    if (!user)
      return this.responseService.sendError(ErrorMessage.USER_NOT_FOUND);

    const kyc = await this.kycRepository.findByUserId(user.id);

    const data = this.userSanitizer.formatUserProfileData(
      user as UserDataForProfile,
      kyc,
    );

    return this.responseService.sendSuccess(
      SuccessMessage.OPERATION_SUCCESSFUL,
      data,
    );
  }

  async cacheUserData(
    userData: UserDataForProfile & {
      hashedAccessToken: string;
    },
    kyc: Kyc,
    ttl = 3600,
  ) {
    const { hashedAccessToken } = userData;
    const userId = userData.id as string;
    const data = this.userSanitizer.formatUserProfileData(userData, kyc);

    await this.cacheService.set(
      userId,
      JSON.stringify({
        ...data,
        hashedAccessToken,
      }),
      ttl,
    );
  }

  async getCachedUserData(
    userId: string,
  ): Promise<CachedUserProfileData | null> {
    const data = this.cacheService.get(userId);
    if (!data) return null;
    return JSON.parse(await this.cacheService.get(userId));
  }

  async verifyEmail(data: { id?: UUID; email?: string }) {
    const { email, id } = data;
    await this.userRepository.update([{ email }, { id }], {
      emailVerifiedAt: new Date(),
    });
  }

  async updateProfile(
    data: (EditUserProfileDTO | UpdateUserProfileDTO) & { userId: UUID },
    isInitialProfileUpdate = false,
  ) {
    const { userId, ...update } = data;

    await this.dbTransactionManager.transaction(async (manager) => {
      const entityManager = manager.entityManager;

      let user: User;

      if (isInitialProfileUpdate) {
        user = await this.userRepository
          .withManager(entityManager)
          .findById(userId);

        if (user.dateOfBirth || user.otherName || user.email)
          return this.responseService.sendError(
            ErrorMessage.PROFILE_SETUP_COMPLETED,
          );
      }

      user = await this.userRepository
        .withManager(entityManager)
        .findbyIdAndUpdate(userId, update);

      const isProfileComplete = !!(
        user.firstName &&
        user.lastName &&
        user.dateOfBirth &&
        user.phoneVerifiedAt
      );

      if (isProfileComplete) {
        await this.walletService.setWalletLimits({
          userId,
          entityManager,
          tier: Tier.ONE,
        });

        await this.kycRepository
          .withManager(entityManager)
          .update({ user: userId }, { isProfileComplete });
      }
    });

    return this.responseService.sendSuccess(
      SuccessMessage.OPERATION_SUCCESSFUL,
      { id: userId },
    );
  }
}
