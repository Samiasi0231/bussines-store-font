import {
  Body,
  Controller,
  Delete,
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
import { AddBeneficiaryDTO } from './dtos/beneficiary.dto';
import { UUID } from 'crypto';
import { PaginationDTO } from '../@common/dtos/pagination.dto';
import { GetByIdParamsDTO } from '../@common/dtos/general.dto';

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

  @Post('beneficiaries')
  async addBeneficiary(
    @Body() body: AddBeneficiaryDTO,
    @Headers('x-wallet-id') walletId: UUID,
  ) {
    return this.walletService.addbeneficiary({ ...body, walletId });
  }

  @Get('beneficiaries')
  async getBeneficiaries(
    @Headers('x-wallet-id') walletId: UUID,
    @Query() query: PaginationDTO,
  ) {
    return this.walletService.getBeneficiaries({ ...query, walletId });
  }

  @Get('beneficiaries/:id')
  async getBeneficiary(@Param() param: GetByIdParamsDTO) {
    return this.walletService.getbeneficiary(param.id);
  }

  @Delete('beneficiaries/:id')
  async deleteBeneficiary(@Param() param: GetByIdParamsDTO) {
    return this.walletService.deletebeneficiary(param.id);
  }

  @Get('/:id')
  async getWallet(@User() user: UserProfile, @Param() param: GetByIdParamsDTO) {
    return this.walletService.getWallet(param.id as UUID, user.id);
  }
}
