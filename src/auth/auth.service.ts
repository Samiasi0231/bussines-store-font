import { Injectable, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRepository } from '../repositories/user.repository';
import { StatusRepository } from '../repositories/status.repository';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { User } from '../entities/user.entity';
import { StatusType } from '../entities/status.entity';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { MailerService } from '../mailer/mailer.service';
import { UUID } from 'crypto';
import { SendEmailDto } from '../mailer/dto/send-mail.dto';
import { renderFile } from 'ejs';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { CacheService } from '../common/cache/cache.service';
import { Response } from '../common/response';

import { ResendEmailDto } from './dto/resend-email.dto';
import {
  ErrorMessage,
  SuccessMessage,
} from '../common/constants/message.constant';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly statusRepository: StatusRepository,
    private readonly jwtService: JwtService,
    private readonly mailerService: MailerService,
    private readonly cacheService: CacheService,
    private readonly responseService: Response,
  ) {}

  async register(registerDto: RegisterDto): Promise<any> {
    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      return this.responseService.sendError(
        ErrorMessage.USER_ALREADY_EXISTS,
        null,
        HttpStatus.CONFLICT,
      );
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 12);

    const activeStatus = await this.statusRepository.findOne({
      where: { name: StatusType.PENDING },
    });

    if (!activeStatus) {
      return this.responseService.sendError(
        ErrorMessage.AN_ERROR_OCCURED,
        null,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const userData = {
      ...registerDto,
      password: hashedPassword,
      status: activeStatus,
    };

    const user = await this.userRepository.createStrict(userData);

    const otp = crypto.randomBytes(3).toString('hex');
    const hashedOtp = await bcrypt.hash(otp, 12);

    await this.userRepository.findbyIdAndUpdate(user.id, {
      verificationOtp: hashedOtp,
      otpExpiration: new Date(Date.now() + 1000 * 60 * 5),
    });

    const emailData: SendEmailDto = {
      recipients: [{ name: user.firstName, address: user.email }],
      subject: 'Your OTP Code',
      html: ``,
    };

    const context = { name: user.firstName, otp };

    emailData.html = await renderFile('src/common/emails/OTP.ejs', context);

    await this.mailerService.sendEmail(emailData);

    return this.responseService.sendSuccess(
      SuccessMessage.USER_REGISTERED,
      user,
    );
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    if (!user) {
      return this.responseService.sendError(ErrorMessage.INVALID_CREDENTIALS);
    }

    await this.userRepository.findbyIdAndUpdate(user.id, {
      lastLoggedInAt: new Date(),
    });

    const userKey = `user:${user.id}`;
    await this.cacheService.set(userKey, JSON.stringify(user), 3600);

    const payload = { email: user.email, sub: user.id };
    const access_token = this.jwtService.sign(payload);

    const userData = {
      access_token,
      user,
    };

    return this.responseService.sendSuccess(
      SuccessMessage.USER_LOGGED_IN,
      userData,
    );
  }

  async verifyEmail(verifyEmailDto: VerifyEmailDto) {
    const { email, otp } = verifyEmailDto;

    const user = await this.userRepository.findOne({
      where: { email },
      select: [
        'id',
        'email',
        'verificationOtp',
        'otpExpiration',
        'emailVerified',
      ],
    });

    if (!user) {
      return this.responseService.sendError(ErrorMessage.USER_NOT_FOUND);
    }

    if (user.emailVerified) {
      return this.responseService.sendError(
        ErrorMessage.EMAIL_ALREADY_VERIFIED,
      );
    }

    if (!user.verificationOtp || !user.otpExpiration) {
      return this.responseService.sendError(
        ErrorMessage.NO_VERIFICATION_OTP_FOUND,
      );
    }

    if (new Date() > user.otpExpiration) {
      return this.responseService.sendError(ErrorMessage.OTP_HAS_EXPIRED);
    }

    const isOtpValid = await bcrypt.compare(otp, user.verificationOtp);
    if (!isOtpValid) {
      return this.responseService.sendError(ErrorMessage.INVALID_OTP);
    }

    await this.userRepository.findbyIdAndUpdate(user.id, {
      emailVerified: true,
      verificationOtp: null,
      otpExpiration: null,
    });

    return this.responseService.sendSuccess(SuccessMessage.EMAIL_VERIFIED);
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

    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    await this.userRepository.findbyIdAndUpdate(userId, {
      password: hashedNewPassword,
    });

    const userKey = `user:${userId}`;
    await this.cacheService.del(userKey);

    return this.responseService.sendSuccess(SuccessMessage.PASSWORD_CHANGED);
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;

    const user = await this.userRepository.findOne({
      where: { email },
      select: ['id', 'email', 'firstName'],
    });

    if (!user) {
      return this.responseService.sendError(ErrorMessage.USER_NOT_FOUND);
    }

    const otp = crypto.randomBytes(3).toString('hex');
    const hashedOtp = await bcrypt.hash(otp, 12);

    const otpExpiration = new Date(Date.now() + 1000 * 60 * 60);

    await this.userRepository.findbyIdAndUpdate(user.id, {
      passwordResetToken: hashedOtp,
      passwordResetExpiration: otpExpiration,
    });

    const emailData: SendEmailDto = {
      recipients: [{ name: user.firstName, address: user.email }],
      subject: 'Reset Your Password',
      html: ``,
    };

    const context = {
      name: user.firstName,
      otp,
    };

    emailData.html = await renderFile(
      'src/common/emails/password-reset.ejs',
      context,
    );

    await this.mailerService.sendEmail(emailData);

    return this.responseService.sendSuccess(
      SuccessMessage.PASSWORD_RESET_EMAIL_SENT,
    );
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { otp, newPassword, email } = resetPasswordDto;

    const user = await this.userRepository.findOne({
      where: { email },
      select: ['id', 'passwordResetToken', 'passwordResetExpiration'],
    });

    if (!user) {
      return this.responseService.sendError(ErrorMessage.USER_NOT_FOUND);
    }

    if (!user.passwordResetToken || !user.passwordResetExpiration) {
      return this.responseService.sendError(ErrorMessage.INVALID_RESET_TOKEN);
    }

    if (new Date() > user.passwordResetExpiration) {
      return this.responseService.sendError(ErrorMessage.INVALID_RESET_TOKEN);
    }

    const isOtpValid = await bcrypt.compare(otp, user.passwordResetToken);
    if (!isOtpValid) {
      return this.responseService.sendError(ErrorMessage.INVALID_RESET_TOKEN);
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    await this.userRepository.findbyIdAndUpdate(user.id, {
      password: hashedNewPassword,
      passwordResetToken: null,
      passwordResetExpiration: null,
    });

    return this.responseService.sendSuccess(SuccessMessage.PASSWORD_RESET);
  }

  async resendVerificationEmail(resendEmailDto: ResendEmailDto) {
    const { email } = resendEmailDto;

    const user = await this.userRepository.findOne({
      where: { email },
      select: ['id', 'email', 'firstName', 'emailVerified'],
    });

    if (!user) {
      return this.responseService.sendError(ErrorMessage.USER_NOT_FOUND);
    }

    if (user.emailVerified) {
      return this.responseService.sendError(
        ErrorMessage.EMAIL_ALREADY_VERIFIED,
      );
    }

    const otp = crypto.randomBytes(3).toString('hex');
    const hashedOtp = await bcrypt.hash(otp, 12);

    await this.userRepository.findbyIdAndUpdate(user.id, {
      verificationOtp: hashedOtp,
      otpExpiration: new Date(Date.now() + 1000 * 60 * 5),
    });

    const emailData: SendEmailDto = {
      recipients: [{ name: user.firstName, address: user.email }],
      subject: 'Your New OTP Code',
      html: ``,
    };

    const context = { name: user.firstName, otp };

    emailData.html = await renderFile('src/common/emails/OTP.ejs', context);

    await this.mailerService.sendEmail(emailData);

    return this.responseService.sendSuccess(
      SuccessMessage.EMAIL_VERIFICATION_EMAIL_SENT,
    );
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { email },
      select: [
        'id',
        'email',
        'password',
        'firstName',
        'lastName',
        'otherName',
        'emailVerified',
        'lastLoggedInAt',
      ],
      relations: ['status'],
    });

    if (user && (await bcrypt.compare(password, user.password))) {
      return user;
    }

    return null;
  }

  async getProfile(userId: UUID) {
    const userKey = `user:${userId}`;

    const cachedUser = await this.cacheService.get(userKey);

    if (cachedUser) {
      return JSON.parse(cachedUser);
    }

    const user = await this.userRepository.findById(userId);
    if (user) {
      await this.cacheService.set(userKey, JSON.stringify(user), 3600);
    }

    return this.responseService.sendSuccess(
      SuccessMessage.OPERATION_SUCCESSFUL,
      user,
    );
  }
}
