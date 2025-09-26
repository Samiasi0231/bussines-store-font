import { Module } from '@nestjs/common';
import { VerificationService } from './verification.service';
import { VerificationController } from './verification.controller';
import { VerificationRepository } from '../repositories/verification.repository';
import { Verification } from '../entities/verification.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from '../user/user.module';

@Module({
  imports: [TypeOrmModule.forFeature([Verification]), UserModule],
  controllers: [VerificationController],
  providers: [VerificationService, VerificationRepository],
})
export class VerificationModule {}
