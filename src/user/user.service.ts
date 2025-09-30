import { HttpStatus, Injectable } from '@nestjs/common';
import { UserRepository } from '../repositories/user.repository';
import { UserSanitizer } from './sanitizers/user.sanitizer';
import { CacheService } from '../@common/cache/cache.service';
import {
  CachedUserProfileData,
  UserDataForProfile,
} from './interfaces/user.interface';
import { IResponse, ResponseService } from '../@common/response';
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

  async verifyPhoneNumber(data: { id?: UUID; phoneNumber?: string }) {
    const { phoneNumber, id } = data;

    await this.userRepository.update([{ phoneNumber }, { id }], {
      phoneVerifiedAt: new Date(),
    });
  }

  async updateProfile(
    data: (EditUserProfileDTO | UpdateUserProfileDTO) & { userId: UUID },
    isInitialProfileUpdate = false,
  ) {
    const { userId, ...update } = data;

    let user: User;

    let response: IResponse<any>;

    let isProfileComplete: boolean;

    response = await this.dbTransactionManager.transaction<
      IResponse<null | {
        id: string;
      }>
    >(async (manager) => {
      const entityManager = manager.entityManager;

      const user = await this.userRepository
        .withManager(entityManager)
        .findById(userId, {
          lock: { mode: 'pessimistic_write' },
        });

      if (!user)
        return this.responseService.sendError(
          ErrorMessage.USER_NOT_FOUND,
          null,
          HttpStatus.NOT_FOUND,
        );

      if (isInitialProfileUpdate) {
        if (user.isProfileComplete)
          return this.responseService.sendError(
            ErrorMessage.PROFILE_SETUP_COMPLETED,
          );

        isProfileComplete =
          'lastName' in update &&
          !!(
            update.firstName &&
            update.lastName &&
            update.dateOfBirth &&
            update.gender &&
            update.phoneNumber
          );

        const userWithPhoneNumber = await this.userRepository
          .withManager(entityManager)
          .find({
            where: {
              phoneNumber: (update as UpdateUserProfileDTO).phoneNumber,
            },
          });

        if (userWithPhoneNumber)
          return this.responseService.sendError(
            ErrorMessage.PHONE_NUMBER_EXISTS,
          );

        if (isProfileComplete) {
          await this.walletService.setWalletLimits({
            userId,
            entityManager,
            tier: Tier.ONE,
          });
        }
      }

      const updateQuery = {
        ...update,
        ...(isProfileComplete ? { isProfileComplete } : {}),
      };

      await this.userRepository
        .withManager(entityManager)
        .update(userId, updateQuery);

      return this.responseService.sendSuccess(
        SuccessMessage.OPERATION_SUCCESSFUL,
        { id: userId },
      );
    });

    return response;
  }
}
