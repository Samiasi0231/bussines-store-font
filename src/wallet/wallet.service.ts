import { HttpStatus, Injectable } from '@nestjs/common';
import { WalletRepository } from '../repositories/wallet.repository';
import { GetWalletsQueryDTO, SetTransactionPinDTO } from './dtos/wallet.dto';
import { VerificationService } from '../verification/verification.service';
import { VerificationIntent } from '../@common/constants/verification.constant';
import { UUID } from 'crypto';
import { IResponse, ResponseService } from '../@common/response';
import {
  ErrorMessage,
  SuccessMessage,
} from '../@common/constants/message.constant';
import { Util } from '../@common/utilities/helpers.utility';
import { EntityManager, FindOptionsWhere } from 'typeorm';
import { Wallet } from '../entities/wallet.entity';
import {
  TransactionLimits,
  WalletType,
} from '../@common/constants/wallet.constant';
import {
  BeneficiaryData,
  WalletData,
  WalletSanitizer,
} from './sanitizers/wallet.sanitizer';
import { Paginated } from '../@common/types/pagination.type';
import { Tier } from '../@common/constants/tier.constant';
import { PaginationDTO } from '../@common/dtos/pagination.dto';
import { BeneficiaryRepository } from '../repositories/beneficiary.repository';
import { AddBeneficiaryDTO } from './dtos/beneficiary.dto';

@Injectable()
export class WalletService {
  constructor(
    private readonly walletRepository: WalletRepository,
    private readonly walletSanitizer: WalletSanitizer,
    private readonly verificationService: VerificationService,
    private readonly responseService: ResponseService,
    private readonly beneficiaryRepository: BeneficiaryRepository,
  ) {}

  async setTransactionPin(
    data: SetTransactionPinDTO & { walletId: string },
  ): Promise<IResponse<{ id: string } | unknown>> {
    const { walletId, pin, otp } = data;
    const wallet = await this.walletRepository.findById(walletId as UUID);

    if (!wallet)
      return this.responseService.sendError(
        ErrorMessage.WALLET_NOT_FOUND,
        null,
        HttpStatus.NOT_FOUND,
      );

    const verificationResponse =
      await this.verificationService.verifyVerification({
        intent: VerificationIntent.TRANSACTION_PIN,
        entityId: walletId,
        verificationData: otp,
      });

    if (!verificationResponse.success) return verificationResponse;

    const hashedPin = await Util.hash(pin);

    await this.walletRepository.findbyIdAndUpdate(walletId as UUID, {
      transactionPin: hashedPin,
    });

    return this.responseService.sendSuccess(
      SuccessMessage.OPERATION_SUCCESSFUL,
      { id: walletId },
    );
  }

  async getWallet(
    id: string,
  ): Promise<IResponse<WalletData | Record<string, never>>> {
    const wallet = await this.walletRepository.findById(id as UUID);

    if (!wallet)
      return this.responseService.sendError(
        ErrorMessage.WALLET_NOT_FOUND,
        null,
        HttpStatus.NOT_FOUND,
      );

    const data = this.walletSanitizer.formatWalletData(wallet);

    return this.responseService.sendSuccess(
      SuccessMessage.RETRIEVE_WALLET,
      data,
    );
  }

  async getWallets(
    data: { userId: string } & GetWalletsQueryDTO,
  ): Promise<IResponse<Paginated<WalletData>>> {
    const { userId, type, page, limit } = data;
    const filter: FindOptionsWhere<Wallet> = { user: userId as UUID };
    if (type) filter.type = type as WalletType;

    const { results: wallets, pagination } =
      await this.walletRepository.paginate({
        filter,
        pagination: { page, limit },
      });

    const results = wallets.map((wallet) =>
      this.walletSanitizer.formatWalletData(wallet),
    );

    return this.responseService.sendSuccess(SuccessMessage.RETRIEVE_WALLETS, {
      results,
      pagination,
    });
  }

  async setWalletLimits(data: {
    id?: UUID;
    userId?: UUID;
    tier: Tier;
    entityManager?: EntityManager;
  }) {
    const { tier, id, entityManager, userId } = data;

    const limits = TransactionLimits[tier];

    const { dailyTransactionLimit, singleTransactionLimit, maxBalanceLimit } =
      limits;

    const filter: FindOptionsWhere<Wallet> = {};
    if (id) filter.id = id;
    else {
      filter.user = { id: userId };
      filter.type = WalletType.PERSONAL;
    }

    const walletRepository = entityManager
      ? this.walletRepository.withManager(entityManager)
      : this.walletRepository;

    await walletRepository.update(filter, {
      dailyTransactionLimit,
      singleTransactionLimit,
      maxBalanceLimit,
    });
  }

  async getBeneficiaries(
    data: {
      walletId: UUID;
    } & PaginationDTO,
  ): Promise<IResponse<Paginated<BeneficiaryData>>> {
    const { walletId, page, limit } = data;

    const wallet = await this.walletRepository.findById(walletId);

    if (!wallet)
      return this.responseService.sendError(
        ErrorMessage.WALLET_NOT_FOUND,
        null,
        HttpStatus.NOT_FOUND,
      );

    const { results: beneficiaries, pagination } =
      await this.beneficiaryRepository.paginate({
        filter: { walletId },
        pagination: { page, limit },
      });

    const results = beneficiaries.map((beneficiary) =>
      this.walletSanitizer.formatBeneficiaryData(beneficiary),
    );

    return this.responseService.sendSuccess(
      SuccessMessage.RETRIEVE_BENEFICIARIES,
      {
        results,
        pagination,
      },
    );
  }

  async getbeneficiary(
    id: string,
  ): Promise<IResponse<BeneficiaryData | Record<string, never>>> {
    const beneficiary = await this.beneficiaryRepository.findById(id as UUID);

    if (!beneficiary)
      return this.responseService.sendError(
        ErrorMessage.NOT_FOUND('Beneficiary'),
        null,
        HttpStatus.NOT_FOUND,
      );

    const data = this.walletSanitizer.formatBeneficiaryData(beneficiary);

    return this.responseService.sendSuccess(
      SuccessMessage.RETRIEVE_BENEFICIARY,
      data,
    );
  }

  async deletebeneficiary(id: string): Promise<IResponse<{ id: string }>> {
    const beneficiary = await this.beneficiaryRepository.findById(id as UUID);

    if (!beneficiary)
      return this.responseService.sendError(
        ErrorMessage.NOT_FOUND('Beneficiary'),
        null,
        HttpStatus.NOT_FOUND,
      );

    await this.beneficiaryRepository.softDeleteById(id as UUID);

    return this.responseService.sendSuccess(SuccessMessage.DELETE_BENEFICIARY, {
      id,
    });
  }

  async addbeneficiary(
    data: { walletId: UUID } & AddBeneficiaryDTO,
  ): Promise<IResponse<{ id: string }>> {
    const wallet = await this.walletRepository.findById(data.walletId);

    if (!wallet)
      return this.responseService.sendError(
        ErrorMessage.WALLET_NOT_FOUND,
        null,
        HttpStatus.NOT_FOUND,
      );

    const beneficiary = await this.beneficiaryRepository.createStrict(data);

    return this.responseService.sendSuccess(SuccessMessage.ADD_BENEFICIARY, {
      id: beneficiary.id,
    });
  }
}
