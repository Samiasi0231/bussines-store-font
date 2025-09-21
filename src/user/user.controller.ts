import { Controller, Get, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { UserProfile } from './interfaces/user.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../@common/decorators/user.decorator';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@User() user: UserProfile) {
    return await this.userService.getProfile(user.id);
  }
}
