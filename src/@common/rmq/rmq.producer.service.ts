import { Injectable } from '@nestjs/common';

import { AmqpClient } from './amqp-client';
import { RmqQueue } from '../constants/queues.constant';

@Injectable()
export class RmqProducerService {
  constructor(private readonly amqpClient: AmqpClient) {}

  async publish(queueName: RmqQueue, payload: any) {
    await this.amqpClient.produce(queueName, payload);
  }
}
