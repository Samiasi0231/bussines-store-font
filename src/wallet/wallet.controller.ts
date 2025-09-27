import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { WalletService } from './wallet.service';
import { GetWalletsQueryDTO, SetTransactionPinDTO } from './dtos/wallet.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../@common/decorators/user.decorator';
import { UserProfile } from '../user/interfaces/user.interface';

@Controller('wallets')
@UseGuards(JwtAuthGuard)
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get()
  async getWallets(
    @User() user: UserProfile,
    @Query() query: GetWalletsQueryDTO,
  ) {
    return this.walletService.getWallets({ userId: user.id, ...query });
  }

  @Post('transaction-pin')
  async setTransactionPin(
    @Headers('x-wallet-id') walletId: string,
    @Body() body: SetTransactionPinDTO,
  ) {
    return this.walletService.setTransactionPin({ ...body, walletId });
  }

  @Get('/:id')
  async getWallet(@Param('id') id: string) {
    return this.walletService.getWallet(id);
  }
}
