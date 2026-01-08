import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { WebhookEvent } from '../entities/webhook-event.entity';
import { UUID } from 'crypto';
import { IResponse, ResponseService } from '../@common/response';
import { DbTransactionManager } from '../@common/database/database-transaction.manager';
import { SuccessMessage } from '../@common/constants/message.constant';
import { WebhookEventRepository } from '../repositories/webhook-event.repository';

export type WebhookEventStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed';

@Injectable()
export class WebhookEventService {
  //   private readonly logger = new Logger(WebhookEventService.name);

  constructor(
    private readonly webhookEventRepository: WebhookEventRepository,
    private readonly dbTransactionManager: DbTransactionManager,
    private readonly responseService: ResponseService,
  ) {}

  /**
   * Create a new webhook event record
   */
  async createWebhookEvent(data: {
    eventType: string;
    source: string;
    payload: any;
    signature?: string;
    ipAddress?: string;
    userAgent?: string;
    idempotencyKey?: string;
    correlationId?: string;
  }) {

    const response = await this.dbTransactionManager.transaction<
      IResponse<{ eventId: UUID; correlationId: string }>
    >(async (manager) => {
      const entityManager = manager.entityManager;
      const event = await this.webhookEventRepository
        .withManager(entityManager)
        .createStrict({
          eventType: data.eventType,
          source: data.source,
          payload: data.payload,
          signature: data.signature,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          idempotencyKey: data.idempotencyKey,
          correlationId:
            data.correlationId ||
            `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          status: 'pending',
        });


      const datax = {
        eventId: event.id,
        correlationId: event.correlationId,
      };
      return this.responseService.sendSuccess(
        SuccessMessage.OPERATION_SUCCESSFUL,
        datax,
        HttpStatus.CREATED,
      );
    });

    return response;
  }

  /**
   * Update webhook event status
   */
  async updateEventStatus(
    eventId: UUID,
    status: WebhookEventStatus,
    errorMessage?: string,
    errorStack?: string,
    notes?: string,
  ): Promise<void> {
    await this.webhookEventRepository.update(eventId, {
      status,
      errorMessage,
      errorStack,
      notes,
      processedAt:
        status === 'completed' || status === 'failed' ? new Date() : undefined,
    });
  }

  /**
   * Update processing time
   */
  async updateProcessingTime(
    eventId: UUID,
    processingTime: number,
  ): Promise<void> {
    await this.webhookEventRepository.update(eventId, {
      processingTime,
    });
  }

  /**
   * Check if webhook is duplicate based on idempotency key
   */
  async checkDuplicate(
    source: string,
    idempotencyKey: string,
    currentEventId: UUID,
  ): Promise<boolean> {
    const existingEvent = await this.webhookEventRepository.findOne({
      where: {
        source,
        idempotencyKey,
        status: 'completed',
      },
    });

    return existingEvent !== null && existingEvent.id !== currentEventId;
  }

  /**
   * Get webhook event by ID
   */
  async getWebhookEvent(eventId: UUID): Promise<WebhookEvent | null> {
    return this.webhookEventRepository.findOne({
      where: { id: eventId },
    });
  }
}
