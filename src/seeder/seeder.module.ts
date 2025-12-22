import { Seeder } from './interfaces/seeder.interface';
import { Module } from '@nestjs/common';
import { ProductCategorySeeder } from './seeders/product-category.seeder';
import { ProductSubCategorySeeder } from './seeders/product-sub-category.seeder';
import { DefaultProviderSeeder } from './seeders/default-provider.seeder';
import { DefaultProductCollectionSeeder } from './seeders/default-product-collection.seeder';
import { BusinessCategorySeeder } from './seeders/business-category.seeder';

export const SEEDERS: (new (...args: any[]) => Seeder)[] = [
  ProductCategorySeeder,
  ProductSubCategorySeeder,
  DefaultProviderSeeder,
  DefaultProductCollectionSeeder,
  BusinessCategorySeeder
];

@Module({
  imports: [],
  providers: [...SEEDERS],
  exports: [...SEEDERS],
})
export class SeederModule {}
