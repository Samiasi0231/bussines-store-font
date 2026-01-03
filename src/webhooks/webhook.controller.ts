import {
  Body,
  Controller,
  HttpStatus,
  Logger,
  Post,
  Req,
  Headers,
} from '@nestjs/common';
import dayjs from 'dayjs';
import { MonnifyWebhookDto } from './dtos/monnify.webhook.dto';
import { WebhookEventService } from './webhook-event.service';
import { WebhookRetryService } from './webhook-retry.service';
import { WebhookService } from './webhook.service';
import { ConfigService } from '@nestjs/config';
import { uuidv4 } from 'uuidv7';
import { Request } from 'express';
import * as crypto from 'crypto';
import { SuccessMessage } from '../@common/constants/message.constant';
import { ResponseService } from '../@common/response';

@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private readonly webhookService: WebhookService,
    private readonly webhookEventService: WebhookEventService,
    private readonly webhookRetryService: WebhookRetryService,
    private readonly configService: ConfigService,
    private readonly responseService: ResponseService,
  ) {}

  /**
   * Get correlation ID from headers or generate new one
   */
  private getCorrelationId(
    headers: Record<string, string>,
  ): string | undefined {
    return headers['x-correlation-id'] || headers['correlation-id'] || uuidv4();
  }

  private getClientIp(req: Request): string {
    return (
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      (req.headers['x-real-ip'] as string) ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      'unknown'
    );
  }

  /**
   * Verify Monnify webhook signature
   */
  verifyMonnifySignature(
    requestBody: any,
    signature: any,
    secretKey: string,
    logger: Logger,
  ) {
    const computedHash = crypto
      .createHmac('sha512', secretKey)
      .update(requestBody)
      .digest('hex');
    logger.log({ 'Monnify Computed Hash:': computedHash });
    return computedHash === signature;
  }

  /**
   * Monnify webhook endpoint
   * Receives payment notifications from Monnify
   *
   * @param payload Webhook payload from Monnify
   * @param req Express request object
   * @param res Express response object
   * @param headers Request headers
   * @returns Webhook processing result
   */
  @Post('monnify')
  async processMonnify(
    @Body() payload: MonnifyWebhookDto,
    @Req() req: Request,
    @Headers() headers: Record<string, string>,
  ) {
    const webhookConfig = this.configService.get('webhook');
    const startTime = dayjs().valueOf();
    const correlationId = this.getCorrelationId(headers);
    const idempotencyKey =
      (req as any).idempotencyKey || headers['idempotency-key'];

    this.logger.log({
      message: 'Monnify webhook received',
      eventType: payload.eventType,
      paymentReference: payload.eventData?.paymentReference,
      correlationId,
      idempotencyKey,
    });

    const {
      data: { eventId, correlationId: finalCorrelationId },
    } = await this.webhookEventService.createWebhookEvent({
      eventType: payload.eventType,
      source: 'monnify',
      payload,
      signature: headers['monnify-signature'] || headers['x-monnify-signature'],
      ipAddress: this.getClientIp(req),
      userAgent: headers['user-agent'],
      idempotencyKey,
      correlationId,
    });

    try {
      await this.webhookEventService.updateEventStatus(eventId, 'processing');

      const requestBody = JSON.stringify(payload);
      const monnifySignature =
        headers['monnify-signature'] || headers['x-monnify-signature'];
      const secretKey = this.configService.get<string>('monnify.secretKey');

      if (!monnifySignature) {
        throw new Error('Missing webhook signature');
      }

      if (
        !this.verifyMonnifySignature(
          requestBody,
          monnifySignature,
          secretKey,
          this.logger,
        )
      ) {
        this.logger.error({
          message: 'Invalid webhook signature',
          eventId,
          correlationId: finalCorrelationId,
          paymentReference: payload.eventData?.paymentReference,
        });

        await this.webhookEventService.updateEventStatus(
          eventId,
          'failed',
          'Invalid webhook signature',
        );

        return this.responseService.sendError(
          'Invalid webhook signature',
          null,
          HttpStatus.BAD_REQUEST,
        );
      }

      if (idempotencyKey) {
        const isDuplicate = await this.webhookEventService.checkDuplicate(
          'monnify',
          idempotencyKey,
          eventId,
        );

        if (isDuplicate) {
          this.logger.warn({
            message: 'Duplicate webhook detected',
            eventId,
            correlationId: finalCorrelationId,
            idempotencyKey,
          });

          await this.webhookEventService.updateEventStatus(
            eventId,
            'completed',
            null,
            null,
            'Duplicate webhook (idempotency)',
          );

          return this.responseService.sendSuccess('Duplicate webhook ignored', {
            eventId,
            correlationId: finalCorrelationId,
            duplicate: true,
          });
        }
      }

      const enableAsyncProcessing =
        webhookConfig?.processing?.enableAsyncProcessing ?? true;

      const result = await this.webhookRetryService.executeWithRetry(
        async () => {
          if (enableAsyncProcessing) {
            setImmediate(async () => {
              try {
                await this.webhookService.processMonnifyWebhook(payload);
                await this.webhookEventService.updateEventStatus(
                  eventId,
                  'completed',
                );
              } catch (error) {
                this.logger.error({
                  message: 'Async webhook processing failed',
                  eventId,
                  error: error.message,
                  stack: error.stack,
                });

                await this.webhookEventService.updateEventStatus(
                  eventId,
                  'failed',
                  error.message,
                  error.stack,
                );
              }
            });

            return { isProcessed: true, async: true };
          } else {
            await this.webhookService.processMonnifyWebhook(payload);
            return { isProcessed: true, async: false };
          }
        },
        eventId,
        'monnify-webhook-processing',
      );

      const processingTime = dayjs().valueOf() - startTime;
      await this.webhookEventService.updateProcessingTime(
        eventId,
        processingTime,
      );

      if (!enableAsyncProcessing) {
        await this.webhookEventService.updateEventStatus(eventId, 'completed');
      }

      this.logger.log({
        message: 'Monnify webhook processed successfully',
        eventId,
        correlationId: finalCorrelationId,
        processingTime,
        result,
      });

      return this.responseService.sendSuccess(
        SuccessMessage.OPERATION_SUCCESSFUL,
        {
          eventId,
          correlationId: finalCorrelationId,
          ...result,
        },
      );
    } catch (error) {
      const processingTime = dayjs().valueOf() - startTime;
      await this.webhookEventService.updateProcessingTime(
        eventId,
        processingTime,
      );
      await this.webhookEventService.updateEventStatus(
        eventId,
        'failed',
        error.message,
        error.stack,
      );

      this.logger.error({
        message: 'Monnify webhook processing failed',
        eventId,
        correlationId: finalCorrelationId,
        error: error.message,
        stack: error.stack,
        processingTime,
      });

      return this.responseService.sendError(
        'Webhook processing failed',
        null,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
