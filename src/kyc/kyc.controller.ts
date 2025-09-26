import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { KycService } from './services/kyc.service';
import {
  VerifyBvnResponseData,
  VerifyIdentityDTO,
  VerifyNINResponseData,
} from './dtos/identity.dto';
import { User } from '../@common/decorators/user.decorator';
import { UserProfile } from '../user/interfaces/user.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IResponse } from '../@common/response';

@Controller('kyc')
@UseGuards(JwtAuthGuard)
export class KycController {
  constructor(private readonly kycService: KycService) {}

  @Post('identity/verification')
  async verifyIdentity(
    @Body() body: VerifyIdentityDTO,
    @User() user: UserProfile,
  ): Promise<
    IResponse<
      Record<string, never> | VerifyBvnResponseData | VerifyNINResponseData
    >
  > {
    return this.kycService.verifyIdentity({
      ...body,
      userId: user.id,
    });
  }
}
