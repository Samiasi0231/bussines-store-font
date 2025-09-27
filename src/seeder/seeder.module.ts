import { Seeder } from './interfaces/seeder.interface';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';

const DATABASE_ENTITIES = [];

export const SEEDERS: (new (...args: any[]) => Seeder)[] = [];

@Module({
  imports: [TypeOrmModule.forFeature(DATABASE_ENTITIES)],
  providers: [...SEEDERS],
  exports: [...SEEDERS],
})
export class SeederModule {}
