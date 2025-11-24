import 'dotenv/config';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ClsModule } from 'nestjs-cls';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { KycModule } from './kyc/kyc.module';
import appConfig from './@common/config/app.config';
import { GlobalModule } from './@common/modules/global.module';
import { VerificationModule } from './verification/verification.module';
import { SeederModule } from './seeder/seeder.module';
import { TerminusModule } from '@nestjs/terminus';
import { AllExceptionsFilter } from './@common/filter/all-exceptions.filter';
import { WalletModule } from './wallet/wallet.module';
import { BusinessModule } from './business/business.module';
import { ProductModule } from './product/product.module';
import { SystemSettingsModule } from './system-settings/system-settings.module';
import { PgPubSubModule } from '@cisstech/nestjs-pg-pubsub';
import { OrdersModule } from './orders/orders.module';
import { CouponModule } from './coupon/coupon.module';
import { InvoiceModule } from './invoice/invoice.module';
import { StoreFrontModule } from './storefront/storefront.module';
import { TransactionModule } from './transaction/transaction.module';
import { CartModule } from './cart/cart.module';

import { SmsModule } from './sms/sms.module';
import { UploadModule } from './upload/upload.module';
const config = appConfig();

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [appConfig],
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const retryAttempts = config.get<number>('db.retryAttempts') || 5;
        const retryDelay = config.get<number>('db.retryDelay') || 3000;

        const synchronize = config.get<boolean>('db.synchronize') || false;
        const env = config.get<string>('ENV');

        // Warn if synchronize is enabled in production
        if (synchronize && env === 'production') {
          throw new Error(
            'DB_SYNCHRONIZE cannot be enabled in production. Use migrations instead.',
          );
        }

        return {
          type: 'postgres',
          host: config.get<string>('db.host'),
          port: config.get<number>('db.port'),
          username: config.get<string>('db.username'),
          password: config.get<string>('db.password'),
          database: config.get<string>('db.name'),
          entities: [__dirname + '/entities/*.entity{.ts,.js}'],
          autoLoadEntities: true,
          // Synchronize: Only enable in development (auto-creates tables from entities)
          // WARNING: This will drop and recreate tables. Use migrations in production.
          synchronize,
          // Retry configuration for connection attempts
          retryAttempts,
          retryDelay,
          // Connection pool configuration with retry support
          extra: {
            connectionLimit: config.get<number>('db.connectionLimit'),
            max: config.get<number>('db.connectionLimit') || 10,
            min: 2,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 10000,
            // Enable connection retry on pool errors
            acquireTimeoutMillis: 60000,
          },
        };
      },
    }),
    PgPubSubModule.forRoot({
      databaseUrl: config.db.connectionString,
      queue: {
        maxRetries: 5,
        messageTTL: 24 * 60 * 60 * 1000,
        cleanupInterval: 60 * 60 * 1000,
        table: 'pg_pubsub_queue',
      },
    }),
    ClsModule.forRoot({
      global: true,
      middleware: { mount: true },
    }),
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60, limit: 20 }],
    }),
    UserModule,
    AuthModule,
    GlobalModule,
    KycModule,
    VerificationModule,
    SeederModule,
    TerminusModule,
    WalletModule,
    BusinessModule,
    ProductModule,
    SystemSettingsModule,
    OrdersModule,
    CouponModule,
    InvoiceModule,
    StoreFrontModule,
    SmsModule,
    TransactionModule,
    UploadModule,
    CartModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
