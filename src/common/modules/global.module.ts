import { Global, Module } from '@nestjs/common';
import { CacheService } from '../cache/cache.service';
import { CacheModule } from '../cache/cache.module';
import { UserRepository } from '../../repositories/user.repository';
import { StatusRepository } from '../../repositories/status.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../entities/user.entity';
import { Status } from '../../entities/status.entity';
import { Response } from '../response';

const providers = [CacheService, UserRepository, StatusRepository, Response];

@Global()
@Module({
  imports: [CacheModule, TypeOrmModule.forFeature([User, Status])],
  providers,
  exports: providers,
})
export class GlobalModule {}
