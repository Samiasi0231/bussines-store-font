import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { TransactionRepository } from '../repositories/transaction.repository';
import { InitiateCheckoutPaymentDTO } from './dtos/checkout.dto';
import { CheckoutPaymentRepository } from '../repositories/checkout-payment.repository';
import {
  DefaultProviderConfig,
  SystemSettingsService,
} from '../system-settings/system-settings.service';
import { ResponseService } from '../@common/response';
import {
  ErrorMessage,
  SuccessMessage,
} from '../@common/constants/message.constant';
import { CheckoutSanitizer } from './sanitizers/checkout.sanitizer';
import { SystemProcess } from '../@common/constants/system-process.constant';
import { CheckoutPaymentStatus } from '../entities/checkout-payment.entity';
import { Status } from '../@common/constants/status.constant';
import { TransactionReferencePrefix } from '../@common/constants/transaction.constant';
import { uuidv7 } from 'uuidv7';
import { Provider } from '../@common/constants/providers.constant';
import { MonnifyProvider } from './providers/monnify.provider';
import { ITransactionProvider } from './interfaces/transaction-provider.interface';
import { Transaction, TransactionType } from '../entities/transaction.entity';
import {
  CreditBusinessWalletDTO,
  CreditTransactionDTO,
  GetTransactionByReferenceDTO,
  GetTransactionsDTO,
} from './dtos/transaction.dto';
import { UUID } from 'crypto';
import { WalletRepository } from '../repositories/wallet.repository';
import { DbTransactionManager } from '../@common/database/database-transaction.manager';
import { TransactionSanitizer } from './sanitizers/transaction.sanitizer';
import { FindOptionsWhere, In } from 'typeorm';
import { Util } from '../@common/utilities/helpers.utility';

@Injectable()
export class TransactionService {
  private readonly logger: Logger;

  constructor(
    private readonly transactionRepository: TransactionRepository,
    private readonly checkoutPaymentRepository: CheckoutPaymentRepository,
    private readonly systemSettingsSevice: SystemSettingsService,
    private readonly responseService: ResponseService,
    private readonly checkoutSanitizer: CheckoutSanitizer,
    private readonly monnifyProvider: MonnifyProvider,
    private readonly walletRepository: WalletRepository,
    private readonly dbTransactionManager: DbTransactionManager,
    private readonly transactionSanitizer: TransactionSanitizer,
  ) {
    this.logger = new Logger(TransactionService.name);
  }

  private getProvider(name: Provider): ITransactionProvider {
    switch (name) {
      case Provider.MONNIFY:
        return this.monnifyProvider;
      default:
        return this.monnifyProvider;
    }
  }

  async initiateCheckoutPayment(payload: InitiateCheckoutPaymentDTO) {
    const { intent } = payload;

    const amount = Util.toKobo(payload.amount);

    const provider = this.systemSettingsSevice.getDefaultProvider(
      DefaultProviderConfig.CHECKOUT,
    );

    if (!provider) {
      this.logger.warn({
        process: SystemProcess.INITIATE_CHECKOUT_PAYMENT,
        message: ErrorMessage.NO_CHECKOUT_PROVIDER_FOUND,
        data: payload,
      });

      return this.responseService.sendError(
        ErrorMessage.GENERIC_ERROR_CONTACT_SUPPORT,
        null,
        HttpStatus.BAD_GATEWAY,
      );
    }

    const checkoutPayment = await this.checkoutPaymentRepository.createStrict({
      amount,
      intent,
      provider,
      reference: `${TransactionReferencePrefix.CHECKOUT}${uuidv7().replace(/-/g, '')}`,
    });

    const data = this.checkoutSanitizer.formatCheckoutPayment(checkoutPayment);

    return this.responseService.sendSuccess(
      SuccessMessage.OPERATION_SUCCESSFUL,
      data,
    );
  }

  async checkCheckoutPaymentStatus(
    paymentReference: string,
  ): Promise<CheckoutPaymentStatus> {
    //TODO: Integrate webhook listener for checkout payments/completed transactions
    const checkoutPayment = await this.checkoutPaymentRepository.findOne({
      where: { reference: paymentReference },
    });

    if (!checkoutPayment) return Status.FAILED;

    if (
      checkoutPayment.status !== Status.SUCCESSFUL &&
      checkoutPayment.status !== Status.FAILED
    ) {
      const getPaymentResponse = await this.getExternalTransaction(
        paymentReference,
        checkoutPayment.provider,
      );

      const paymentData = getPaymentResponse.data;

      if (paymentData.status !== checkoutPayment.status) {
        await this.checkoutPaymentRepository.update(checkoutPayment.id, {
          status: paymentData.status as CheckoutPaymentStatus,
          processedAt: paymentData.processedAt,
          serviceResponse: paymentData.serviceResponse,
          channel: paymentData.method,
        });
      }

      return checkoutPayment.status;
    }

    return checkoutPayment.status;
  }

  getExternalTransaction(reference: string, providerName: string) {
    const provider = this.getProvider(providerName as Provider);

    return provider.getTransactionByInternalReference(reference);
  }

  async creditBusinessWallet(payload: CreditBusinessWalletDTO) {
    const { businessId, ...creditPayload } = payload;

    const wallet = await this.walletRepository.findOne({
      where: { business: businessId as UUID },
    });

    if (!wallet) {
      return this.responseService.sendError(
        ErrorMessage.WALLET_NOT_FOUND,
        null,
        HttpStatus.NOT_FOUND,
      );
    }

    return this.credit({ ...creditPayload, walletId: wallet.id });
  }

  async credit(payload: CreditTransactionDTO) {
    const { amount, walletId, purpose, channel, narration, metadata } = payload;

    if (amount <= 0)
      return this.responseService.sendError(ErrorMessage.INVALID_AMOUNT);

    const response = await this.dbTransactionManager.transaction(
      async (manager) => {
        const entityManager = manager.entityManager;

        const wallet = await this.walletRepository
          .withManager(entityManager)
          .findById(walletId as UUID, {
            lock: { mode: 'pessimistic_write' },
          });

        if (!wallet) {
          return this.responseService.sendError(
            ErrorMessage.WALLET_NOT_FOUND,
            null,
            HttpStatus.NOT_FOUND,
          );
        }

        const balanceBefore = wallet.balance;

        const balanceAfter = await this.getBalanceAfter({
          amount,
          balanceBefore,
          type: TransactionType.CREDIT,
        });

        const transaction = await this.transactionRepository
          .withManager(entityManager)
          .createStrict({
            amount,
            wallet: wallet.id,
            purpose,
            channel,
            status: Status.SUCCESSFUL,
            reference:
              TransactionReferencePrefix.TRANSACTION +
              uuidv7().replace(/-/g, ''),
            type: TransactionType.CREDIT,
            balanceBefore,
            balanceAfter,
            groupReference: uuidv7().replace(/-/g, ''),
            narration,
            metadata,
          });

        await this.walletRepository
          .withManager(entityManager)
          .increaseBalance(wallet.id, amount);

        const data = this.transactionSanitizer.formatTransaction(transaction);

        return this.responseService.sendSuccess(
          SuccessMessage.OPERATION_SUCCESSFUL,
          data,
        );
      },
    );

    return response;
  }

  async getBalanceAfter({
    amount,
    balanceBefore,
    type,
  }: {
    amount: number;
    balanceBefore: number;
    type: TransactionType;
  }) {
    if (type === TransactionType.CREDIT) {
      return balanceBefore + amount;
    } else {
      return balanceBefore - amount;
    }
  }

  async getTransaction(payload: GetTransactionByReferenceDTO) {
    const { reference } = payload;

    const transaction = await this.transactionRepository.findOne({
      where: { reference },
    });

    if (!transaction) {
      return this.responseService.sendError(
        ErrorMessage.NOT_FOUND('Transaction'),
        null,
        HttpStatus.NOT_FOUND,
      );
    }

    const data = this.transactionSanitizer.formatTransaction(transaction);

    return this.responseService.sendSuccess(
      SuccessMessage.OPERATION_SUCCESSFUL,
      data,
    );
  }

  async getTransactions(payload: GetTransactionsDTO) {
    const { sort, type, status, page, limit, wallet: walletId } = payload;

    const filter: FindOptionsWhere<Transaction> = {};
    if (type?.length > 0) filter.type = In(type);
    if (status?.length > 0) filter.status = In(status);
    if (walletId) filter.wallet = walletId as UUID;

    const sortFilter = Util.parseSortParam(sort, {
      date: 'date',
      amount: 'amount',
    });

    const { results: transactions, pagination } =
      await this.transactionRepository.paginate({
        filter,
        pagination: { page, limit },
        sort: sortFilter,
      });

    const results = transactions.map((transaction) =>
      this.transactionSanitizer.formatTransaction(transaction),
    );

    return this.responseService.sendSuccess(
      SuccessMessage.OPERATION_SUCCESSFUL,
      { results, pagination },
    );
  }

  async isDuplicateOrderPayment(
    externalReference: string,
    orderId: string,
    orderItemId: string,
  ): Promise<boolean> {
    const transaction = await this.transactionRepository.findOne({
      where: {
        metadata: { externalReference, orderId, orderItemId },
        status: Status.SUCCESSFUL,
      },
    });

    return !!transaction;
  }
}
