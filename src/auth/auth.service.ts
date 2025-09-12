import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
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
import { ResendEmailDto } from './dto/resend-email.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly statusRepository: StatusRepository,
    private readonly jwtService: JwtService,
    private readonly mailerService: MailerService,
    private readonly cacheService: CacheService,
  ) {}

  async register(registerDto: RegisterDto): Promise<any> {
    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 12);

    const activeStatus = await this.statusRepository.findOne({
      where: { name: StatusType.PENDING },
    });

    if (!activeStatus) {
      throw new InternalServerErrorException('Active status not found');
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

    return user;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
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

    return userData;
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
      throw new UnauthorizedException('User not found');
    }

    if (user.emailVerified) {
      throw new ConflictException('Email already verified');
    }

    if (!user.verificationOtp || !user.otpExpiration) {
      throw new UnauthorizedException('No verification OTP found');
    }

    if (new Date() > user.otpExpiration) {
      throw new UnauthorizedException('OTP has expired');
    }

    const isOtpValid = await bcrypt.compare(otp, user.verificationOtp);
    if (!isOtpValid) {
      throw new UnauthorizedException('Invalid OTP');
    }

    const verifiedStatus = await this.statusRepository.findOne({
      where: { name: StatusType.ACTIVE },
    });

    if (!verifiedStatus) {
      throw new Error('Verified status not found');
    }

    await this.userRepository.findbyIdAndUpdate(user.id, {
      emailVerified: true,
      verificationOtp: null,
      otpExpiration: null,
      status: verifiedStatus,
    });
  }

  async changePassword(userId: UUID, changePasswordDto: ChangePasswordDto) {
    const { currentPassword, newPassword } = changePasswordDto;

    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'password'],
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    await this.userRepository.findbyIdAndUpdate(userId, {
      password: hashedNewPassword,
    });

    const userKey = `user:${userId}`;
    await this.cacheService.del(userKey);
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;

    const user = await this.userRepository.findOne({
      where: { email },
      select: ['id', 'email', 'firstName'],
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedResetToken = await bcrypt.hash(resetToken, 12);

    const resetExpiration = new Date(Date.now() + 1000 * 60 * 60);

    await this.userRepository.findbyIdAndUpdate(user.id, {
      passwordResetToken: hashedResetToken,
      passwordResetExpiration: resetExpiration,
    });

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/password/reset?token=${resetToken}`;

    const emailData: SendEmailDto = {
      recipients: [{ name: user.firstName, address: user.email }],
      subject: 'Reset Your Password',
      html: ``,
    };

    const context = {
      name: user.firstName,
      resetUrl,
    };

    emailData.html = await renderFile(
      'src/common/emails/password-reset.ejs',
      context,
    );

    await this.mailerService.sendEmail(emailData);
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { token, newPassword, email } = resetPasswordDto;

    const user = await this.userRepository.findOne({
      where: { email },
      select: ['id', 'passwordResetToken', 'passwordResetExpiration'],
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (
      user.passwordResetToken &&
      (await bcrypt.compare(token, user.passwordResetToken))
    ) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    if (
      !user.passwordResetExpiration ||
      new Date() > user.passwordResetExpiration
    ) {
      throw new UnauthorizedException('Reset token has expired');
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    await this.userRepository.findbyIdAndUpdate(user.id, {
      password: hashedNewPassword,
      passwordResetToken: null,
      passwordResetExpiration: null,
    });
  }

  async resendVerificationEmail(resendEmailDto: ResendEmailDto) {
    const { email } = resendEmailDto;

    const user = await this.userRepository.findOne({
      where: { email },
      select: ['id', 'email', 'firstName', 'emailVerified'],
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.emailVerified) {
      throw new ConflictException('Email is already verified');
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

    return user;
  }
}
