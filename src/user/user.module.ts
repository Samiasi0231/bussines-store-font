import { forwardRef, Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { UserSanitizer } from './sanitizers/user.sanitizer';
import { WalletModule } from '../wallet/wallet.module';
import { KycModule } from '../kyc/kyc.module';

@Module({
  imports: [forwardRef(() => WalletModule), KycModule],
  controllers: [UserController],
  providers: [UserService, UserSanitizer],
  exports: [UserService, UserSanitizer],
})
export class UserModule {}
