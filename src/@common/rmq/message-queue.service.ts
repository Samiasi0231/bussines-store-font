import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IMessageQueue } from './interfaces/message-queue.interface';
import { MemoryQueue } from './implementations/memory-queue.implementation';
import { RabbitMQQueue } from './implementations/rabbitmq-queue.implementation';

@Injectable()
export class MessageQueueService implements IMessageQueue, OnModuleInit {
  private readonly logger = new Logger(MessageQueueService.name);
  private queue: IMessageQueue;

  constructor(
    private readonly configService: ConfigService,
    private readonly memoryQueue: MemoryQueue,
    private readonly rabbitMQQueue: RabbitMQQueue,
  ) {}

  onModuleInit() {
    const queueType = this.configService.get<string>('queue.type') || 'memory';
    const amqpUrl = this.configService.get<string>('AMQP_URL');
    const rabbitMQEnabled = this.configService.get<boolean>('queue.rabbitmq.enabled');

    // Use RabbitMQ if explicitly enabled and URL is provided, otherwise use memory queue
    if (queueType === 'rabbitmq' && rabbitMQEnabled && amqpUrl) {
      this.queue = this.rabbitMQQueue;
      this.logger.log('Using RabbitMQ for message queue');
    } else {
      this.queue = this.memoryQueue;
      this.logger.log('Using in-memory message queue');
      if (queueType === 'rabbitmq' && (!rabbitMQEnabled || !amqpUrl)) {
        this.logger.warn(
          'RabbitMQ requested but not enabled or URL not provided. Falling back to in-memory queue.',
        );
      }
    }
  }

  async publish(queue: string, message: any): Promise<void> {
    return this.queue.publish(queue, message);
  }

  async subscribe(
    queue: string,
    handler: (message: any) => Promise<void> | void,
  ): Promise<void> {
    return this.queue.subscribe(queue, handler);
  }

  async unsubscribe(queue: string): Promise<void> {
    return this.queue.unsubscribe(queue);
  }
}

