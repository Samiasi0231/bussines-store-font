import { Module } from '@nestjs/common';
import { BusinessService } from './business.service';
import { BusinessController } from './business.controller';
import { KycModule } from '../kyc/kyc.module';
import { BusinessSanitizer } from './sanitizers/business.sanitizer';
import { InvoiceModule } from '../invoice/invoice.module';

@Module({
  imports: [KycModule, InvoiceModule],
  controllers: [BusinessController],
  providers: [BusinessService, BusinessSanitizer],
  exports: [BusinessService, BusinessSanitizer],
})
export class BusinessModule {}
