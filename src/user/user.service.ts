import { Injectable } from '@nestjs/common';
import { UserRepository } from '../repositories/user.repository';
import { UserSanitizer } from './sanitizers/user.sanitizer';
import { CacheService } from '../@common/cache/cache.service';
import { CachedUserProfileData } from './interfaces/user.interface';
import { ResponseService } from '../@common/response';
import { UUID } from 'crypto';
import {
  SuccessMessage,
  ErrorMessage,
} from '../@common/constants/message.constant';
import { EditUserProfileDTO, UpdateUserProfileDTO } from './dtos/user.dto';
import { KycRepository } from '../repositories/kyc.repository';
import { DbTransactionManager } from '../@common/database/database-transaction.manager';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly kycRepository: KycRepository,
    private readonly userSanitizer: UserSanitizer,
    private readonly cacheService: CacheService,
    private readonly responseService: ResponseService,
    private readonly dbTransactionManager: DbTransactionManager,
  ) {}

  async getProfile(userId: UUID) {
    const cachedUser = await this.getCachedUserData(userId);

    if (cachedUser && cachedUser.containsCompleteData) {
      return this.responseService.sendSuccess(
        SuccessMessage.OPERATION_SUCCESSFUL,
      );
    }

    const user = await this.userRepository.findById(userId);

    if (!user)
      return this.responseService.sendError(ErrorMessage.USER_NOT_FOUND);

    await this.cacheUserData({
      ...user,
      containsCompleteData: true,
      hashedAccessToken: cachedUser?.hashedAccessToken,
    } as CachedUserProfileData);

    return this.responseService.sendSuccess(
      SuccessMessage.OPERATION_SUCCESSFUL,
      user,
    );
  }

  async cacheUserData(data: CachedUserProfileData, ttl = 3600) {
    const { containsCompleteData = false, hashedAccessToken } = data;
    const userId = data.id as string;
    const userData = this.userSanitizer.formatUserProfileData(data);

    await this.cacheService.set(
      userId,
      JSON.stringify({
        ...userData,
        containsCompleteData,
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
  ) {
    const { userId, ...update } = data;

    await this.dbTransactionManager.transaction(
      async (manager: DbTransactionManager) => {
        const entityManager = manager.entityManager;
        const user = await this.userRepository
          .withManager(entityManager)
          .findbyIdAndUpdate(userId, update);

        const isProfileComplete = !!(
          user.firstName &&
          user.lastName &&
          user.dateOfBirth &&
          user.phoneVerifiedAt
        );

        if (isProfileComplete)
          await this.kycRepository
            .withManager(entityManager)
            .update({ user: userId }, { isProfileComplete });
      },
    );

    return this.responseService.sendSuccess(
      SuccessMessage.OPERATION_SUCCESSFUL,
      { id: userId },
    );
  }
}
