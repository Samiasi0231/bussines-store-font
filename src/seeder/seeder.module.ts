import { Seeder } from './interfaces/seeder.interface';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';

const databaseEntities = [];

export const SEEDERS: (new (...args: any[]) => Seeder)[] = [];

@Module({
  imports: [TypeOrmModule.forFeature(databaseEntities)],
  providers: [...SEEDERS],
  exports: [...SEEDERS],
})
export class SeederModule {}
