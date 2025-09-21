import { Global, Module } from '@nestjs/common';
import { CacheService } from '../cache/cache.service';
import { CacheModule } from '../cache/cache.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Status } from '../../entities/status.entity';
import { ResponseService } from '../response';
import { StatusRepository } from '../../repositories/status.repository';

const providers = [CacheService, ResponseService, StatusRepository];

const databaseEntitities = [Status];
@Global()
@Module({
  imports: [CacheModule, TypeOrmModule.forFeature(databaseEntitities)],
  providers,
  exports: providers,
})
export class GlobalModule {}
