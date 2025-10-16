import { Body, Controller, Get, Patch, Query, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { UserProfile } from './interfaces/user.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../@common/decorators/user.decorator';
import { EditUserProfileDTO, UpdateUserProfileDTO } from './dtos/user.dto';
import { PaginationDTO } from '../@common/dtos/pagination.dto';
import { UUID } from 'crypto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  async getProfile(@User() user: UserProfile) {
    return this.userService.getProfile(user.id);
  }

  @Patch('profile/edit')
  async editProfile(
    @User() user: UserProfile,
    @Body() body: EditUserProfileDTO,
  ) {
    return this.userService.updateProfile({ ...body, userId: user.id });
  }

  @Patch('profile')
  async updateProfile(
    @User() user: UserProfile,
    @Body() body: UpdateUserProfileDTO,
  ) {
    return this.userService.updateProfile({ ...body, userId: user.id }, true);
  }

  @Get('addresses')
  async getAddresses(@User() user: UserProfile, @Query() query: PaginationDTO) {
    return this.userService.getAddresses({ userId: user.id as UUID, ...query });
  }
}
