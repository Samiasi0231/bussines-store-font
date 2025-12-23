import { Module } from '@nestjs/common';
import { BusinessService } from './business.service';
import { BusinessController } from './business.controller';
import { KycModule } from '../kyc/kyc.module';
import { BusinessSanitizer } from './sanitizers/business.sanitizer';
import { InvoiceModule } from '../invoice/invoice.module';
import { BusinessCategoryService } from './business-category.service';
import { BusinessCategoryController } from './business-category.controller';
import { BusinessTypeController } from './business-type.controller';
import { BusinessTypeService } from './business-type.service';

@Module({
  imports: [KycModule, InvoiceModule],
  controllers: [
    BusinessController,
    BusinessCategoryController,
    BusinessTypeController,
  ],
  providers: [
    BusinessService,
    BusinessSanitizer,
    BusinessCategoryService,
    BusinessTypeService,
  ],
  exports: [
    BusinessService,
    BusinessSanitizer,
    BusinessCategoryService,
    BusinessTypeService,
  ],
})
export class BusinessModule {}
