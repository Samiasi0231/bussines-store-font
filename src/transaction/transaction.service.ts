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
import {
  ITransactionProvider,
  InitializeTransactionPayload,
} from './interfaces/transaction-provider.interface';
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
import { nanoid } from 'nanoid';
import { PaymentIntent } from '../@common/constants/payment-intent.constant';

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

  /**
   * Initialize a checkout payment with the configured provider
   * @param payload Payment initialization data
   * @returns Checkout payment details with payment URL
   */
  async initiateCheckoutPayment(payload: InitiateCheckoutPaymentDTO) {
    const { intent, customerEmail, customerName } = payload;

    const amount = payload.amount;

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

    const reference = `${TransactionReferencePrefix.CHECKOUT}${uuidv7().replace(/-/g, '')}`;

    const checkoutPayment = await this.checkoutPaymentRepository.createStrict({
      amount,
      intent,
      provider,
      reference,
    });

    const providerInstance = this.getProvider(provider as Provider);

    const initializePayload: InitializeTransactionPayload = {
      amount,
      customerName: customerName || 'Customer',
      customerEmail: customerEmail || 'customer@example.com',
      paymentReference: reference,
      paymentDescription: `Payment for ${intent}`,
      redirectUrl: payload.redirectUrl,
      metadata: {
        intent,
        checkoutPaymentId: checkoutPayment.id,
      },
    };

    try {
      const initializeResponse =
        await providerInstance.initializeTransaction(initializePayload);

      if (!initializeResponse.success) {
        this.logger.error({
          process: SystemProcess.INITIATE_CHECKOUT_PAYMENT,
          message: 'Failed to initialize payment with provider',
          reference,
          error: initializeResponse,
        });

        return this.responseService.sendError(
          ErrorMessage.GENERIC_ERROR_CONTACT_SUPPORT,
          null,
          HttpStatus.BAD_GATEWAY,
        );
      }

      await this.checkoutPaymentRepository.update(checkoutPayment.id, {
        providerReference: initializeResponse.data.transactionReference,
      });

      const data = {
        ...this.checkoutSanitizer.formatCheckoutPayment(checkoutPayment),
        checkoutUrl: initializeResponse.data.checkoutUrl,
        paymentMethods: initializeResponse.data.enabledPaymentMethods,
        providerReference: initializeResponse.data.transactionReference,
      };

      return this.responseService.sendSuccess(
        SuccessMessage.OPERATION_SUCCESSFUL,
        data,
      );
    } catch (error) {
      this.logger.error({
        process: SystemProcess.INITIATE_CHECKOUT_PAYMENT,
        message: 'Error initializing payment',
        reference,
        error,
      });

      return this.responseService.sendError(
        ErrorMessage.GENERIC_ERROR_CONTACT_SUPPORT,
        null,
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  /**
   * Check and update checkout payment status
   * @param paymentReference Payment reference to check
   * @returns Current payment status
   */
  async checkCheckoutPaymentStatus(
    paymentReference: string,
  ): Promise<CheckoutPaymentStatus> {
    const checkoutPayment = await this.checkoutPaymentRepository.findOne({
      where: { reference: paymentReference },
    });

    if (!checkoutPayment) {
      this.logger.warn({
        process: SystemProcess.CHECK_CHECKOUT_PAYMENT_STATUS,
        message: 'Checkout payment not found',
        reference: paymentReference,
      });
      return Status.FAILED;
    }


    if (
      checkoutPayment.status === Status.SUCCESSFUL ||
      checkoutPayment.status === Status.FAILED
    ) {
      return checkoutPayment.status;
    }

    try {
      const getPaymentResponse = await this.requeryTransaction(
        paymentReference,
        checkoutPayment.provider,
      );

      if (!getPaymentResponse.success) {
        this.logger.error({
          process: SystemProcess.CHECK_CHECKOUT_PAYMENT_STATUS,
          message: 'Failed to query payment status',
          reference: paymentReference,
        });
        return checkoutPayment.status;
      }

      const paymentData = getPaymentResponse.data;

      if (paymentData.status !== checkoutPayment.status) {
        await this.checkoutPaymentRepository.update(checkoutPayment.id, {
          status: paymentData.status as CheckoutPaymentStatus,
          processedAt: paymentData.processedAt,
          serviceResponse: paymentData.serviceResponse,
          channel: paymentData.method,
        });

        this.logger.log({
          process: SystemProcess.CHECK_CHECKOUT_PAYMENT_STATUS,
          message: 'Payment status updated',
          reference: paymentReference,
          oldStatus: checkoutPayment.status,
          newStatus: paymentData.status,
        });

        return paymentData.status as CheckoutPaymentStatus;
      }

      return checkoutPayment.status;
    } catch (error) {
      this.logger.error({
        process: SystemProcess.CHECK_CHECKOUT_PAYMENT_STATUS,
        message: 'Error checking payment status',
        reference: paymentReference,
        error,
      });
      return checkoutPayment.status;
    }
  }

  /**
   * Get transaction details from external provider
   * @param reference Payment reference
   * @param providerName Provider name
   * @returns Transaction details
   */
  getExternalTransaction(reference: string, providerName: string) {
    const provider = this.getProvider(providerName as Provider);
    return provider.getTransactionByInternalReference(reference);
  }

  /**
   * Requery transaction status from provider
   * @param reference Payment reference
   * @param providerName Provider name
   * @returns Transaction status details
   */
  async requeryTransaction(reference: string, providerName?: string) {
    const provider = providerName
      ? this.getProvider(providerName as Provider)
      : this.monnifyProvider;

    this.logger.log({
      process: SystemProcess.REQUERY_TRANSACTION,
      message: 'Requerying transaction',
      reference,
      provider: providerName || Provider.MONNIFY,
    });

    return provider.getTransactionByInternalReference(reference);
  }

  /**
   * Credit a business wallet
   * @param payload Credit transaction data
   * @returns Credit transaction result
   */
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

  /**
   * Credit a wallet with pessimistic locking
   * @param payload Credit transaction data
   * @returns Credit transaction result
   */
  async credit(payload: CreditTransactionDTO) {
    const { amount, walletId, purpose, channel, narration, metadata } = payload;

    if (amount <= 0) {
      return this.responseService.sendError(ErrorMessage.INVALID_AMOUNT);
    }

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
            reference: this.generateReference('transaction'),
            type: TransactionType.CREDIT,
            balanceBefore,
            balanceAfter,
            groupReference: this.generateReference('group'),
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

  /**
   * Calculate balance after transaction
   * @param params Transaction parameters
   * @returns New balance
   */
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

  /**
   * Get transaction by reference
   * @param payload Transaction query data
   * @returns Transaction details
   */
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

  /**
   * Get paginated list of transactions
   * @param payload Transaction filter and pagination data
   * @returns Paginated transactions
   */
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

  /**
   * Check if an order payment is duplicate
   * @param externalReference External payment reference
   * @param orderId Order ID
   * @param orderItemId Order item ID
   * @returns True if duplicate, false otherwise
   */
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

  /**
   * Generate unique transaction reference
   * @param type Reference type
   * @returns Generated reference
   */
  private generateReference(type: 'transaction' | 'group'): string {
    switch (type) {
      case 'transaction':
        return (
          TransactionReferencePrefix.TRANSACTION + nanoid(15).toUpperCase()
        );
      case 'group':
        return (
          TransactionReferencePrefix.GROUP_TRANSACTION +
          nanoid(15).toUpperCase()
        );
      default:
        return (
          TransactionReferencePrefix.TRANSACTION + nanoid(15).toUpperCase()
        );
    }
  }
}
