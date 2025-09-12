import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { CurrentUser } from '../common/decorators/user.decorator';
import { User } from '../entities/user.entity';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ResendEmailDto } from './dto/resend-email.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async register(@Body() registerDto: RegisterDto) {
    const data = await this.authService.register(registerDto);
    return {
      status: HttpStatus.CREATED,
      success: true,
      message:
        'User registered successfully. Please check your email for verification code.',
      data,
    };
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    const data = await this.authService.login(loginDto);
    return {
      status: HttpStatus.OK,
      success: true,
      message: 'Login successful',
      data,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@CurrentUser() user: User) {
    const data = await this.authService.getProfile(user.id);
    return {
      status: HttpStatus.OK,
      success: true,
      message: 'Profile retrieved successfully',
      data,
    };
  }

  @Post('email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    await this.authService.verifyEmail(verifyEmailDto);
    return {
      status: HttpStatus.OK,
      success: true,
      message: 'Email verified successfully',
      data: null,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('password/change')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentUser() user: User,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    await this.authService.changePassword(user.id, changePasswordDto);
    return {
      status: HttpStatus.OK,
      success: true,
      message: 'Password changed successfully',
      data: null,
    };
  }

  @Post('password/forgot')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    await this.authService.forgotPassword(forgotPasswordDto);
    return {
      status: HttpStatus.OK,
      success: true,
      message:
        'If an account with that email exists, a password reset link has been sent.',
      data: null,
    };
  }

  @Post('email/resend')
  @HttpCode(HttpStatus.OK)
  async resendEmail(@Body() resendEmailDto: ResendEmailDto) {
    await this.authService.resendVerificationEmail(resendEmailDto);
    return {
      status: HttpStatus.OK,
      success: true,
      message: 'Verification email sent successfully',
      data: null,
    };
  }

  @Post('password/reset')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    await this.authService.resetPassword(resetPasswordDto);
    return {
      status: HttpStatus.OK,
      success: true,
      message: 'Password reset successfully',
      data: null,
    };
  }
}
