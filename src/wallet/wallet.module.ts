import { Module } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { WalletSanitizer } from './sanitizers/wallet.sanitizer';
import { VerificationModule } from '../verification/verification.module';

@Module({
  imports: [VerificationModule],
  controllers: [WalletController],
  providers: [WalletService, WalletSanitizer],
  exports: [WalletService, WalletSanitizer],
})
export class WalletModule {}
