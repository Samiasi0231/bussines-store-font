import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { User } from '../entities/user.entity';
import { UserRepository } from '../repositories/user.repository';
import { NotificationModule } from '../notification/notification.module';
import { TokenService } from './token/token.service';
import { UserSanitizer } from '../user/sanitizers/user.sanitizer';
import { UserService } from '../user/user.service';
import { Kyc } from '../entities/kyc.entity';
import { KycRepository } from '../repositories/kyc.repository';
import { VerificationService } from '../verification/verification.service';
import { VerificationRepository } from '../repositories/verification.repository';
import { Verification } from '../entities/verification.entity';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: {
          expiresIn: configService.get<string>('jwt.expiresIn'),
        },
      }),
    }),
    TypeOrmModule.forFeature([User, Kyc, Verification]),
    NotificationModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    LocalStrategy,
    UserRepository,
    TokenService,
    UserSanitizer,
    KycRepository,
    UserService,
    VerificationService,
    VerificationRepository,
  ],
  exports: [AuthService],
})
export class AuthModule {}
