import { Module } from '@nestjs/common';
import { VerificationService } from './verification.service';
import { VerificationController } from './verification.controller';
import { VerificationRepository } from '../repositories/verification.repository';
import { Verification } from '../entities/verification.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationModule } from '../notification/notification.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Verification]),
    NotificationModule,
    UserModule,
  ],
  controllers: [VerificationController],
  providers: [VerificationService, VerificationRepository],
})
export class VerificationModule {}
