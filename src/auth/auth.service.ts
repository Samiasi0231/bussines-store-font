import { Injectable, HttpStatus } from '@nestjs/common';
import { UserRepository } from '../repositories/user.repository';
import { SignupDTO } from './dto/register.dto';
import { LoginDTO } from './dto/login.dto';
import bcrypt from 'bcryptjs';
import { EmailService } from '../notification/services/email.service';
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
import { Status as StatusEntity } from '../entities/status.entity';
import { TokenService } from './token/token.service';
import { UserService } from '../user/user.service';
import {
  CachedUserProfileData,
  UserProfile,
} from '../user/interfaces/user.interface';
import { UserSanitizer } from '../user/sanitizers/user.sanitizer';
import { KycRepository } from '../repositories/kyc.repository';
import { VerificationService } from '../verification/verification.service';
import { VerificationIntent } from '../@common/constants/verification.constant';
import { StatusRepository } from '../repositories/status.repository';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly tokenService: TokenService,
    private readonly mailerService: EmailService,
    private readonly cacheService: CacheService,
    private readonly responseService: ResponseService,
    private readonly userService: UserService,
    private readonly userSanitizer: UserSanitizer,
    private readonly kycRepository: KycRepository,
    private readonly verificationService: VerificationService,
    private readonly statusRepository: StatusRepository,
  ) {}

  async register(payload: SignupDTO): Promise<any> {
    const { phoneNumber, password, otp } = payload;

    const existingUser = await this.userRepository.findOne({
      where: { phoneNumber },
    });

    if (existingUser) {
      return this.responseService.sendError(
        ErrorMessage.USER_ALREADY_EXISTS,
        null,
        HttpStatus.CONFLICT,
      );
    }

    const verificationResponse =
      await this.verificationService.verifyVerification({
        intent: VerificationIntent.PHONE_NUMBER,
        entityId: phoneNumber,
        verificationData: otp,
      });

    if (!verificationResponse.success) return verificationResponse;

    const activeStatus = await this.statusRepository.findByName(Status.ACTIVE);

    if (!activeStatus) {
      //TODO: log error
      return this.responseService.sendError(
        ErrorMessage.AN_ERROR_OCCURRED,
        null,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const userData = {
      ...payload,
      password,
      phoneVerifiedAt: new Date(),
      status: activeStatus,
    };

    const user = await this.userRepository.createStrict(userData);

    await this.kycRepository.createStrict({ user: user.id });

    return this.responseService.sendSuccess(SuccessMessage.USER_REGISTERED, {
      id: user.id,
    });
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

    const userId = user.id;

    const { accessToken, hashedAccessToken } =
      await this.tokenService.generateJWTToken(userId);

    const userData = {
      accessToken,
      user,
    };

    await this.userService.cacheUserData({
      ...user,
      hashedAccessToken,
    } as CachedUserProfileData);

    return this.responseService.sendSuccess(
      SuccessMessage.USER_LOGGED_IN,
      userData,
    );
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

    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
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
    const { otp, newPassword, email } = resetPasswordDto;

    const user = await this.userRepository.findOne({
      where: { email },
      select: ['id'],
    });

    if (!user) {
      return this.responseService.sendError(ErrorMessage.USER_NOT_FOUND);
    }

    const verificationResponse =
      await this.verificationService.verifyVerification({
        intent: VerificationIntent.PASSWORD_UPDATE,
        entityId: email,
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
  ): Promise<UserProfile | null> {
    const user = await this.userRepository.findOne({
      where: [{ email: identifier }, { phoneNumber: identifier }],
      select: [
        'id',
        'email',
        'password',
        'firstName',
        'lastName',
        'otherName',
        'phoneNumber',
        'avatar',
      ],
      relations: ['status'],
    });

    if (!user) return null;

    const passwordsMatch = await Util.verifyHash(user.password, password);

    if (user && passwordsMatch) {
      return this.userSanitizer.formatUserProfileData(user as UserProfile);
    }

    return null;
  }
}
