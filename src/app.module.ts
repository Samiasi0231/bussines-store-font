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

const DB_CONNECTION_STRING = `postgresql://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [appConfig],
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('db.host'),
        port: config.get<number>('db.port'),
        username: config.get<string>('db.username'),
        password: config.get<string>('db.password'),
        database: config.get<string>('db.name'),
        entities: [__dirname + '/entities/*.entity{.ts,.js}'],
        autoLoadEntities: true,
        retryAttempts: 5,
        extra: {
          connectionLimit: config.get<number>('db.connectionLimit'),
        },
      }),
    }),
    PgPubSubModule.forRoot({
      databaseUrl: DB_CONNECTION_STRING,
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
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
