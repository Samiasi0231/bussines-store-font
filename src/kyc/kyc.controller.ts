import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { KycService } from './services/kyc.service';
import { VerifyIdentityDTO } from './dtos/identity.dto';
import { User } from '../@common/decorators/user.decorator';
import { UserProfile } from '../user/interfaces/user.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('kyc')
@UseGuards(JwtAuthGuard)
export class KycController {
  constructor(private readonly kycService: KycService) {}

  @Post('/kyc/identity/verification')
  async verifyIdentityByDocument(
    @Body() body: VerifyIdentityDTO,
    @User() user: UserProfile,
  ) {
    return this.kycService.verifyIdentity({
      ...body,
      userId: user.id,
    });
  }
}
