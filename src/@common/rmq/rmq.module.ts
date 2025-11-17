import { Module } from '@nestjs/common';
import { RmqProducerService } from './rmq.producer.service';
import { AmqpClient } from './amqp-client';

@Module({
  providers: [RmqProducerService, AmqpClient],
  exports: [RmqProducerService, AmqpClient],
})
export class RmqModule {}
