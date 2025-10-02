import { Module } from '@nestjs/common';
import { BusinessService } from './business.service';
import { BusinessController } from './business.controller';
import { KycModule } from '../kyc/kyc.module';
import { BusinessSanitizer } from './sanitizers/business.sanitizer';

@Module({
  imports: [KycModule],
  controllers: [BusinessController],
  providers: [BusinessService, BusinessSanitizer],
  exports: [BusinessService, BusinessSanitizer],
})
export class BusinessModule {}
