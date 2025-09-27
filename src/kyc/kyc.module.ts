import { Module } from '@nestjs/common';
import { DojahService } from './services/dojah.service';
import { KycService } from './services/kyc.service';
import { KycController } from './kyc.controller';
import { HttpModule } from '@nestjs/axios';
import { ImageRecognitionService } from '../image-recognition/services/image-recognition.service';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [HttpModule, WalletModule],
  providers: [KycService, DojahService, ImageRecognitionService],
  exports: [KycService],
  controllers: [KycController],
})
export class KycModule {}
