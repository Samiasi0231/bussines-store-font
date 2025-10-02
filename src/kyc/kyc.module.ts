import { Module } from '@nestjs/common';
import { DojahService } from './services/dojah.service';
import { KycService } from './services/kyc.service';
import { KycController } from './kyc.controller';
import { HttpModule } from '@nestjs/axios';
import { ImageRecognitionService } from '../image-recognition/services/image-recognition.service';
import { WalletModule } from '../wallet/wallet.module';
import { KycSanitizer } from './sanitizers/kyc.sanitizer';

@Module({
  imports: [HttpModule, WalletModule],
  providers: [KycService, DojahService, ImageRecognitionService, KycSanitizer],
  exports: [KycService, KycSanitizer],
  controllers: [KycController],
})
export class KycModule {}
