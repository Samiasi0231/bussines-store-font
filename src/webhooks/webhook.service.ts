import { Injectable, Logger } from '@nestjs/common';
import { OrdersService } from '../orders/orders.service';
import { TransactionService } from '../transaction/transaction.service';
import { MonnifyWebhookPayload } from './utils/monnify.webhook.utils';
import { MonnifyEventType } from './dtos/monnify.webhook.dto';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    private readonly ordersService: OrdersService,
    private readonly transactionService: TransactionService,
  ) {}

  /**
   * Process Monnify webhook event
   * @param payload Monnify webhook payload
   */
  async processMonnifyWebhook(payload: MonnifyWebhookPayload): Promise<void> {
    const { eventType, eventData } = payload;
    const { paymentReference, transactionReference, paymentStatus } = eventData;

    this.logger.log({
      message: 'Processing Monnify webhook',
      eventType,
      paymentReference,
      transactionReference,
      paymentStatus,
    });


    switch (eventType) {
      case MonnifyEventType.SUCCESSFUL_TRANSACTION:
        await this.handleSuccessfulTransaction(eventData);
        break;

      case MonnifyEventType.FAILED_TRANSACTION:
        await this.handleFailedTransaction(eventData);
        break;

      case MonnifyEventType.OVERPAYMENT:
        break;

      case MonnifyEventType.REVERSED_TRANSACTION:
        break;

      default:
        this.logger.warn({
          message: 'Unknown Monnify event type',
          eventType,
          paymentReference,
        });
    }
  }

  /**
   * Handle successful transaction webhook
   */
  private async handleSuccessfulTransaction(eventData: any): Promise<void> {
    const { paymentReference, transactionReference, amountPaid } = eventData;

    this.logger.log({
      message: 'Handling successful transaction',
      paymentReference,
      transactionReference,
      amountPaid,
    });

    try {
      const result = await this.ordersService.verifyAndProcessPayment({
        paymentReference,
      });

      if (result.success) {
        this.logger.log({
          message: 'Payment verified and processed successfully',
          paymentReference,
          orderId: result.data?.orderId,
        });
      } else {
        this.logger.warn({
          message: 'Payment verification returned non-success',
          paymentReference,
          result: result.message,
        });
      }
    } catch (error) {
      this.logger.error({
        message: 'Failed to process successful transaction',
        paymentReference,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Handle failed transaction webhook
   */
  private async handleFailedTransaction(eventData: any): Promise<void> {
    const { paymentReference, transactionReference } = eventData;

    this.logger.log({
      message: 'Handling failed transaction',
      paymentReference,
      transactionReference,
    });

    try {
      const result = await this.ordersService.verifyAndProcessPayment({
        paymentReference,
      });

      this.logger.log({
        message: 'Failed transaction webhook processed',
        paymentReference,
        result,
      });
    } catch (error) {
      this.logger.error({
        message: 'Error processing failed transaction webhook',
        paymentReference,
        error: error.message,
      });

    }
  }
}
