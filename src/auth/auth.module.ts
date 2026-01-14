import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { DeviceJwtStrategy } from './strategies/device-jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { TokenService } from './token/token.service';
import { UserModule } from '../user/user.module';
import { VerificationModule } from '../verification/verification.module';
import { KycModule } from '../kyc/kyc.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Address } from '../entities/address.entity';
import { AddressRepository } from '../repositories/address.repository';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: {
          expiresIn: (configService.get<string | number>('jwt.expiresIn') || '24h') as any,
        },
      }),
    }),
    UserModule,
    VerificationModule,
    KycModule,
    TypeOrmModule.forFeature([Address]),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    DeviceJwtStrategy,
    LocalStrategy,
    TokenService,
    AddressRepository,
  ],
  exports: [AuthService],
})
export class AuthModule {}
