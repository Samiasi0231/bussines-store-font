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
import { ProductCollection } from '../../entities/product-collection.entity';
import { ProductCollectionProduct } from '../../entities/product-collection-product.entity';
import { ProductCollectionProductRepository } from '../../repositories/product-collection-product.repository';
import { ProductCollectionRepository } from '../../repositories/product-collection.repository';
import { Coupon } from '../../entities/coupon.entity';
import { CouponRepository } from '../../repositories/coupon.repository';
import { OrderRepository } from '../../repositories/order.repository';
import { OrderCouponRepository } from '../../repositories/order-coupon.repository';
import { OrderItemRepository } from '../../repositories/order-item.repository';
import { TransactionRepository } from '../../repositories/transaction.repository';
import { Order } from '../../entities/order.entity';
import { OrderItem } from '../../entities/order-item.entity';
import { Transaction } from '../../entities/transaction.entity';
import { OrderCoupon } from '../../entities/order-coupon.entity';
import { InvoiceUser } from '../../entities/invoice-user.entity';
import { Invoice } from '../../entities/invoice.entity';
import { InvoiceItem } from '../../entities/invoice-item.entity';
import { InvoiceRepository } from '../../repositories/invoice.repository';
import { InvoiceUserRepository } from '../../repositories/invoice-user.repository';
import { InvoiceItemRepository } from '../../repositories/invoice-item.repository';
import { Storefront } from '../../entities/storefront.entity';
import { StorefrontRepository } from '../../repositories/storefront.repository';
import { CheckoutPayment } from '../../entities/checkout-payment.entity';
import { CheckoutPaymentRepository } from '../../repositories/checkout-payment.repository';
import { RmqModule } from '../rmq/rmq.module';
import { BusinessCategoryRepository } from '../../repositories/business-category.repository';
import { BusinessCategory } from '../../entities/business-category.entity';

const repositories = [
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
  ProductCollectionProductRepository,
  ProductCollectionRepository,
  CouponRepository,
  OrderRepository,
  OrderCouponRepository,
  OrderItemRepository,
  TransactionRepository,
  InvoiceRepository,
  InvoiceUserRepository,
  InvoiceItemRepository,
  StorefrontRepository,
  CheckoutPaymentRepository,
  BusinessCategoryRepository
];

const providers = [...repositories, ResponseService];

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
  ProductCollection,
  ProductCollectionProduct,
  Coupon,
  Order,
  OrderItem,
  OrderCoupon,
  Transaction,
  InvoiceUser,
  Invoice,
  InvoiceItem,
  Storefront,
  CheckoutPayment,
  BusinessCategory
];

@Global()
@Module({
  imports: [
    CacheModule,
    DatabaseModule,
    ImageRecognitionModule,
    NotificationModule,
    SystemSettingsModule,
    RmqModule,
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
    RmqModule,
  ],
})
export class GlobalModule {}
