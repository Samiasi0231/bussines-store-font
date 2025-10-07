import { Seeder } from './interfaces/seeder.interface';
import { Module } from '@nestjs/common';
import { ProductCategorySeeder } from './seeders/product-category.seeder';
import { ProductSubCategorySeeder } from './seeders/product-sub-category.seeder';

export const SEEDERS: (new (...args: any[]) => Seeder)[] = [
  ProductCategorySeeder,
  ProductSubCategorySeeder,
];

@Module({
  imports: [],
  providers: [...SEEDERS],
  exports: [...SEEDERS],
})
export class SeederModule {}
