import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDTO } from './dto/register.dto';
import { LoginDTO } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { User } from '../@common/decorators/user.decorator';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UserProfile } from '../user/interfaces/user.interface';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async register(@Body() registerDto: SignupDTO) {
    return await this.authService.register(registerDto);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Body() loginDto: LoginDTO) {
    return await this.authService.login(loginDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('password/change')
  async changePassword(
    @User() user: UserProfile,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return await this.authService.changePassword(user.id, changePasswordDto);
  }

  @Post('password/reset')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return await this.authService.resetPassword(resetPasswordDto);
  }
}
