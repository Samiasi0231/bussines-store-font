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
import { Business } from '../../entities/business.entity';
import { BusinessRepository } from '../../repositories/business.repository';
import { ProductCategory } from '../../entities/product-category.entity';
import { ProductSubCategory } from '../../entities/product-sub-category.entity';
import { ProductSubCategoryRepository } from '../../repositories/product-sub-category.repository';
import { ProductCategoryRepository } from '../../repositories/product-category.repository';
import { StoreRepository } from '../../repositories/store.repository';
import { Store } from '../../entities/store.entity';
import { ProductImage } from '../../entities/product-image.entity';
import { ProductImageRepository } from '../../repositories/product-image.repository';
import { ProductVariant } from '../../entities/product-variant.entity';
import { ProductAttribute } from '../../entities/product-attribute.entity';
import { ProductVariantRepository } from '../../repositories/product-variant.repository';
import { ProductAttributeRepository } from '../../repositories/product-attribute.repository';
import { ProductRepository } from '../../repositories/product.repository';
import { Product } from '../../entities/product.entity';
import { SystemSettings } from '../../entities/system-setting.entity';
import { SystemSettingsRepository } from '../../repositories/system-setting.repository';
import { SystemSettingsModule } from '../../system-settings/system-settings.module';

const providers = [
  ResponseService,
  IdentityVerificationRepository,
  AddressRepository,
  UserRepository,
  WalletRepository,
  KycRepository,
  VerificationRepository,
  BeneficiaryRepository,
  BusinessRepository,
  ProductSubCategoryRepository,
  ProductCategoryRepository,
  StoreRepository,
  ProductImageRepository,
  ProductAttributeRepository,
  ProductVariantRepository,
  ProductRepository,
  SystemSettingsRepository,
];

const DATABASE_ENTITIES = [
  Kyc,
  User,
  Address,
  Wallet,
  Verification,
  IdentityVerification,
  Beneficiary,
  Business,
  ProductCategory,
  ProductSubCategory,
  Store,
  ProductImage,
  ProductVariant,
  ProductAttribute,
  Product,
  SystemSettings,
];

@Global()
@Module({
  imports: [
    CacheModule,
    DatabaseModule,
    ImageRecognitionModule,
    NotificationModule,
    SystemSettingsModule,
    TypeOrmModule.forFeature(DATABASE_ENTITIES),
  ],
  providers,
  exports: [
    ...providers,
    CacheModule,
    DatabaseModule,
    ImageRecognitionModule,
    NotificationModule,
    SystemSettingsModule,
  ],
})
export class GlobalModule {}
