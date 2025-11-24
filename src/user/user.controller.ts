import { Body, Controller, Get, Patch, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import { UserProfile } from './interfaces/user.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../@common/decorators/user.decorator';
import { EditUserProfileDTO, UpdateUserProfileDTO } from './dtos/user.dto';
import { PaginationDTO } from '../@common/dtos/pagination.dto';
import { UUID } from 'crypto';
import { ApiJwtAuth } from '../@common/swagger/decorators/api-bearer-auth.decorator';
import {
  ApiStandardResponse,
  ApiPaginatedResponse,
  ApiCommonErrorResponses,
} from '../@common/swagger/decorators/api-response.decorator';
import {
  UserProfileResponseDto,
  AddressResponseDto,
} from './dtos/user-response.dto';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiJwtAuth()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  @ApiOperation({
    summary: 'Get user profile',
    description: 'Retrieves the authenticated user profile information',
  })
  @ApiStandardResponse(UserProfileResponseDto, 'User profile retrieved successfully')
  @ApiCommonErrorResponses()
  async getProfile(@User() user: UserProfile) {
    return this.userService.getProfile(user.id);
  }

  @Patch('profile/edit')
  @ApiOperation({
    summary: 'Edit user profile (partial update)',
    description: 'Partially updates the user profile (e.g., avatar only)',
  })
  @ApiStandardResponse(UserProfileResponseDto, 'Profile updated successfully')
  @ApiCommonErrorResponses()
  async editProfile(
    @User() user: UserProfile,
    @Body() body: EditUserProfileDTO,
  ) {
    return this.userService.updateProfile({ ...body, userId: user.id });
  }

  @Patch('profile')
  @ApiOperation({
    summary: 'Update user profile',
    description: 'Updates the complete user profile information',
  })
  @ApiStandardResponse(UserProfileResponseDto, 'Profile updated successfully')
  @ApiCommonErrorResponses()
  async updateProfile(
    @User() user: UserProfile,
    @Body() body: UpdateUserProfileDTO,
  ) {
    return this.userService.updateProfile({ ...body, userId: user.id }, true);
  }

  @Get('addresses')
  @ApiOperation({
    summary: 'Get user addresses',
    description: 'Retrieves paginated list of user addresses',
  })
  @ApiPaginatedResponse(AddressResponseDto, 'Addresses retrieved successfully')
  @ApiCommonErrorResponses()
  async getAddresses(@User() user: UserProfile, @Query() query: PaginationDTO) {
    return this.userService.getAddresses({ userId: user.id as UUID, ...query });
  }
}
