import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import {
  VerificationChannel,
  VerificationIntent,
} from '../../@common/constants/verification.constant';

export class InitiateVerificationDTO {
  @IsEnum(VerificationIntent)
  intent: VerificationIntent;

  @IsString()
  @IsNotEmpty()
  entityId: string;

  @IsEnum(VerificationChannel)
  channel: VerificationChannel;
}

export class VerifyVerificationDTO {
  @IsEnum(VerificationIntent)
  intent: VerificationIntent;

  @IsString()
  @IsNotEmpty()
  entityId: string;

  @IsString()
  @IsNotEmpty()
  verificationData: string;
}
