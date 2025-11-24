import { Module } from '@nestjs/common';
import { RmqProducerService } from './rmq.producer.service';
import { AmqpClient } from './amqp-client';
import { MessageQueueService } from './message-queue.service';
import { MemoryQueue } from './implementations/memory-queue.implementation';
import { RabbitMQQueue } from './implementations/rabbitmq-queue.implementation';
import { InMemoryEventHandlerService } from './in-memory-event-handler.service';

@Module({
  providers: [
    RmqProducerService,
    AmqpClient,
    MessageQueueService,
    MemoryQueue,
    RabbitMQQueue,
    InMemoryEventHandlerService,
  ],
  exports: [
    RmqProducerService,
    AmqpClient,
    MessageQueueService,
    InMemoryEventHandlerService,
  ],
})
export class RmqModule {}
