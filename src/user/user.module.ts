import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { User } from '../entities/user.entity';
import { UserRepository } from '../repositories/user.repository';
import { UserSanitizer } from './sanitizers/user.sanitizer';
import { KycRepository } from '../repositories/kyc.repository';
import { Kyc } from '../entities/kyc.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Kyc])],
  controllers: [UserController],
  providers: [UserService, UserRepository, UserSanitizer, KycRepository],
  exports: [UserService, UserRepository, UserSanitizer],
})
export class UserModule {}
