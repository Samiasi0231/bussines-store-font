import { Global, Module } from '@nestjs/common';
import { ResponseService } from '../response';
import { CacheModule } from '../cache/cache.module';
import { DatabaseModule } from '../database/database.module';
import { ImageRecognitionModule } from '../../image-recognition/image-recognition.module';
import { NotificationModule } from '../../notification/notification.module';
import { IdentityVerificationRepository } from '../../repositories/identity-verification.repository';
import { AddressRepository } from '../../repositories/address.repository';
import { UserRepository } from '../../repositories/user.repository';
import { WalletRepository } from '../../repositories/wallet.repository';
import { KycRepository } from '../../repositories/kyc.repository';
import { VerificationRepository } from '../../repositories/verification.repository';
import { Kyc } from '../../entities/kyc.entity';
import { User } from '../../entities/user.entity';
import { Address } from '../../entities/address.entity';
import { Wallet } from '../../entities/wallet.entity';
import { Verification } from '../../entities/verification.entity';
import { IdentityVerification } from '../../entities/identity-verification.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Beneficiary } from '../../entities/beneficiary.entity';
import { BeneficiaryRepository } from '../../repositories/beneficiary.repository';

const providers = [
  ResponseService,
  IdentityVerificationRepository,
  AddressRepository,
  UserRepository,
  WalletRepository,
  KycRepository,
  VerificationRepository,
  BeneficiaryRepository,
];

const DATABASE_ENTITIES = [
  Kyc,
  User,
  Address,
  Wallet,
  Verification,
  IdentityVerification,
  Beneficiary,
];

@Global()
@Module({
  imports: [
    CacheModule,
    DatabaseModule,
    ImageRecognitionModule,
    NotificationModule,
    TypeOrmModule.forFeature(DATABASE_ENTITIES),
  ],
  providers,
  exports: [
    ...providers,
    CacheModule,
    DatabaseModule,
    ImageRecognitionModule,
    NotificationModule,
  ],
})
export class GlobalModule {}
