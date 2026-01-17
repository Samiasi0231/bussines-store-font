import { Seeder } from './interfaces/seeder.interface';
import { Module } from '@nestjs/common';
import { ProductCategorySeeder } from './seeders/product-category.seeder';
import { ProductSubCategorySeeder } from './seeders/product-sub-category.seeder';
import { DefaultProviderSeeder } from './seeders/default-provider.seeder';
import { DefaultProductCollectionSeeder } from './seeders/default-product-collection.seeder';
import { BusinessCategorySeeder } from './seeders/business-category.seeder';
import { BusinessTypeSeeder } from './seeders/business-type.seeder';
import { AdminUserSeeder } from './seeders/admin-user.seeder';

export const SEEDERS: (new (...args: any[]) => Seeder)[] = [
  ProductCategorySeeder,
  ProductSubCategorySeeder,
  DefaultProviderSeeder,
  DefaultProductCollectionSeeder,
  BusinessCategorySeeder,
  BusinessTypeSeeder,
  AdminUserSeeder,
];

@Module({
  imports: [],
  providers: [...SEEDERS],
  exports: [...SEEDERS],
})
export class SeederModule {}
