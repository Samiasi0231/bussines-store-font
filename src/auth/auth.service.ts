import { Injectable, HttpStatus } from '@nestjs/common';
import { UserRepository } from '../repositories/user.repository';
import { SignupDTO } from './dto/register.dto';
import { LoginDTO } from './dto/login.dto';
import { UUID } from 'crypto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { CacheService } from '../@common/cache/cache.service';
import {
  ErrorMessage,
  SuccessMessage,
} from '../@common/constants/message.constant';
import { ResponseService } from '../@common/response';
import { Status } from '../@common/constants/status.constant';
import { Util } from '../@common/utilities/helpers.utility';
import { TokenService } from './token/token.service';
import { UserService } from '../user/user.service';
import { KycRepository } from '../repositories/kyc.repository';
import { VerificationService } from '../verification/verification.service';
import { VerificationIntent } from '../@common/constants/verification.constant';
import { DbTransactionManager } from '../@common/database/database-transaction.manager';
import { User } from '../entities/user.entity';
import { WalletRepository } from '../repositories/wallet.repository';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly tokenService: TokenService,
    private readonly cacheService: CacheService,
    private readonly responseService: ResponseService,
    private readonly userService: UserService,
    private readonly kycRepository: KycRepository,
    private readonly verificationService: VerificationService,
    private readonly dbTransactionManager: DbTransactionManager,
    private readonly walletRepository: WalletRepository,
  ) {}

  async register(payload: SignupDTO): Promise<any> {
    const { email, password, otp } = payload;

    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser && !existingUser.isGuest) {
      return this.responseService.sendError(
        ErrorMessage.USER_WITH_EMAIL_EXISTS,
        null,
        HttpStatus.CONFLICT,
      );
    }

    const verificationResponse =
      await this.verificationService.verifyVerification({
        intent: VerificationIntent.EMAIL_ADDRESS,
        entityId: email,
        verificationData: otp,
      });

    if (!verificationResponse.success) return verificationResponse;

    const userData = {
      email,
      password,
      emailVerifiedAt: new Date(),
      status: Status.ACTIVE,
      signUpDate: new Date(),
    };

    const user = await this.dbTransactionManager.transaction<User>(
      async (manager) => {
        const entityManager = manager.entityManager;
        let user: User;

        if (existingUser && existingUser.isGuest)
          user = await this.userRepository
            .withManager(entityManager)
            .findbyIdAndUpdate(existingUser.id, {
              ...userData,
              isGuest: false,
            });

        user = await this.userRepository
          .withManager(entityManager)
          .createStrict(userData);

        await this.kycRepository
          .withManager(entityManager)
          .createStrict({ user: user.id });

        await this.walletRepository
          .withManager(entityManager)
          .createStrict({ user: user.id });

        return user;
      },
    );

    return this.responseService.sendSuccess(
      SuccessMessage.USER_REGISTERED,
      {
        id: user.id,
      },
      HttpStatus.CREATED,
    );
  }

  async login(loginDto: LoginDTO) {
    const user = await this.validateUser(
      loginDto.identifier,
      loginDto.password,
    );

    if (!user) {
      return this.responseService.sendError(ErrorMessage.INVALID_CREDENTIALS);
    }

    await this.userRepository.findbyIdAndUpdate(user.id, {
      lastLoggedInAt: new Date(),
    });

    const kyc = await this.kycRepository.findByUserId(user.id);

    const userId = user.id;

    const { accessToken, hashedAccessToken } =
      await this.tokenService.generateJWTToken(userId);

    await this.userService.cacheUserData(
      {
        ...user,
        hashedAccessToken,
      } as any,
      kyc,
    );

    const data = {
      accessToken,
      id: user.id,
    };

    return this.responseService.sendSuccess(
      SuccessMessage.USER_LOGGED_IN,
      data,
    );
  }

  async logout(userId: UUID) {
    await this.cacheService.del(userId);
    return this.responseService.sendSuccess(SuccessMessage.LOGOUT);
  }

  async changePassword(userId: UUID, changePasswordDto: ChangePasswordDto) {
    const { currentPassword, newPassword } = changePasswordDto;

    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'password'],
    });

    if (!user) {
      return this.responseService.sendError(ErrorMessage.USER_NOT_FOUND);
    }

    const isCurrentPasswordValid = await Util.verifyHash(
      user.password,
      currentPassword,
    );

    if (!isCurrentPasswordValid) {
      return this.responseService.sendError(
        ErrorMessage.CURRENT_PASSWORD_INCORRECT,
      );
    }

    const hashedNewPassword = await Util.hash(newPassword);

    await this.userRepository.findbyIdAndUpdate(userId, {
      password: hashedNewPassword,
    });

    await this.cacheService.del(userId);

    return this.responseService.sendSuccess(SuccessMessage.PASSWORD_CHANGED);
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { otp, newPassword, identifier } = resetPasswordDto;

    const user = await this.userRepository.findOne({
      where: [{ phoneNumber: identifier }, { email: identifier }],
      select: ['id'],
    });

    if (!user) {
      return this.responseService.sendError(
        ErrorMessage.USER_NOT_FOUND,
        null,
        HttpStatus.NOT_FOUND,
      );
    }

    const verificationResponse =
      await this.verificationService.verifyVerification({
        intent: VerificationIntent.PASSWORD_RESET,
        entityId: identifier,
        verificationData: otp,
      });

    if (!verificationResponse.success) return verificationResponse;

    const hashedNewPassword = await Util.hash(newPassword);

    await this.userRepository.findbyIdAndUpdate(user.id, {
      password: hashedNewPassword,
    });

    return this.responseService.sendSuccess(SuccessMessage.PASSWORD_RESET);
  }

  async validateUser(
    identifier: string,
    password: string,
  ): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: [{ email: identifier }, { phoneNumber: identifier }],
    });

    if (!user) return null;

    const passwordsMatch = await Util.verifyHash(user.password, password);

    if (user && passwordsMatch) return user;

    return null;
  }
}
