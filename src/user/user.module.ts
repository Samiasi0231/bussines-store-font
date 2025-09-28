import { forwardRef, Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { UserSanitizer } from './sanitizers/user.sanitizer';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [forwardRef(() => WalletModule)],
  controllers: [UserController],
  providers: [UserService, UserSanitizer],
  exports: [UserService, UserSanitizer],
})
export class UserModule {}
