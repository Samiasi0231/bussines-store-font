import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { MessageQueueService } from './message-queue.service';
import { RmqQueue } from '../constants/queues.constant';
import { IN_MEMORY_EVENT_PATTERN } from './decorators/in-memory-event-pattern.decorator';

@Injectable()
export class InMemoryEventHandlerService implements OnModuleInit {
  private readonly logger = new Logger(InMemoryEventHandlerService.name);

  constructor(
    private readonly messageQueueService: MessageQueueService,
    private readonly moduleRef: ModuleRef,
  ) {}

  async onModuleInit() {
    // Only register handlers if using in-memory queue
    const queueType = process.env.QUEUE_TYPE || 'memory';
    if (queueType !== 'memory') {
      return;
    }

    // Get all controllers and register their event handlers
    // This is a simplified approach - in production, you might want to use
    // a more sophisticated discovery mechanism
    this.logger.log('Registering in-memory event handlers...');

    // Register handlers for known queues
    await this.registerQueueHandlers();
  }

  private async registerQueueHandlers() {
    // This would need to be enhanced to automatically discover handlers
    // For now, we'll document how to manually register handlers
    this.logger.debug('In-memory queue handlers should be registered manually');
  }

  /**
   * Manually register a handler for a queue
   * Call this from your controller's onModuleInit
   */
  async registerHandler(
    queue: RmqQueue | string,
    handler: (message: any) => Promise<void> | void,
  ): Promise<void> {
    await this.messageQueueService.subscribe(queue, handler);
    this.logger.log(`Registered in-memory handler for queue: ${queue}`);
  }
}

