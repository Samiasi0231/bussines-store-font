import { IsString, IsNotEmpty, IsIn } from 'class-validator';
import {
  VerificationChannel,
  VerificationIntent,
} from '../../@common/constants/verification.constant';

export class InitiateVerificationDTO {
  @IsIn(Object.values(VerificationIntent))
  intent: VerificationIntent;

  @IsString()
  @IsNotEmpty()
  entityId: string;

  @IsIn(Object.values(VerificationChannel))
  channel: VerificationChannel;
}

export class VerifyVerificationDTO {
  @IsIn(Object.values(VerificationIntent))
  intent: VerificationIntent;

  @IsString()
  @IsNotEmpty()
  entityId: string;

  @IsString()
  @IsNotEmpty()
  verificationData: string;
}
