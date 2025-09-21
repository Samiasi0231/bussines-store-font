import { Body, Controller, Post } from '@nestjs/common';
import { VerificationService } from './verification.service';
import {
  InitiateVerificationDTO,
  VerifyVerificationDTO,
} from './dtos/verification.dto';

@Controller('verifications')
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}

  @Post()
  async initiateVerification(@Body() body: InitiateVerificationDTO) {
    return this.verificationService.initiateVerification(body);
  }

  @Post('verify')
  async verifyVerification(@Body() body: VerifyVerificationDTO) {
    return this.verificationService.verifyVerification(body);
  }
}
