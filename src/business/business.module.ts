import { Module } from '@nestjs/common';
import { BusinessService } from './business.service';
import { BusinessController } from './business.controller';
import { KycModule } from '../kyc/kyc.module';
import { BusinessSanitizer } from './sanitizers/business.sanitizer';
import { InvoiceModule } from '../invoice/invoice.module';
import { BusinessCategoryService } from './business-category.service';
import { BusinessCategoryController } from './business-category.controller';

@Module({
  imports: [KycModule, InvoiceModule],
  controllers: [BusinessController, BusinessCategoryController],
  providers: [BusinessService, BusinessSanitizer, BusinessCategoryService],
  exports: [BusinessService, BusinessSanitizer, BusinessCategoryService],
})
export class BusinessModule {}
