import { Module } from '@nestjs/common';
import { DojahService } from './services/dojah.service';
import { KycService } from './services/kyc.service';
import { KycController } from './kyc.controller';
import { HttpModule } from '@nestjs/axios';
import { User } from '../entities/user.entity';
import { IdentityVerification } from '../entities/identity-verification.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IdentityVerificationRepository } from '../repositories/identity-verification.repository';
import { UserRepository } from '../repositories/user.repository';
import { ImageRecognitionService } from '../image-recognition/services/image-recognition.service';
import { Address } from '../entities/address.entity';
import { Kyc } from '../entities/kyc.entity';
import { KycRepository } from '../repositories/kyc.repository';
import { AddressRepository } from '../repositories/address.repository';

const databaseEntities = [User, IdentityVerification, Address, Kyc];
@Module({
  imports: [HttpModule, TypeOrmModule.forFeature(databaseEntities)],
  providers: [
    KycService,
    DojahService,
    UserRepository,
    IdentityVerificationRepository,
    ImageRecognitionService,
    KycRepository,
    AddressRepository,
  ],
  exports: [KycService],
  controllers: [KycController],
})
export class KycModule {}
