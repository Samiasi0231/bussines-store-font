import { Seeder } from './interfaces/seeder.interface';
import { Status } from '../entities/status.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { StatusRepository } from '../repositories/status.repository';
import { StatusSeeder } from './seeders/status.seeder';

const databaseEntities = [Status];

export const SEEDERS: (new (...args: any[]) => Seeder)[] = [StatusSeeder];

@Module({
  imports: [TypeOrmModule.forFeature(databaseEntities)],
  providers: [...SEEDERS, StatusRepository],
  exports: [...SEEDERS],
})
export class SeederModule {}
