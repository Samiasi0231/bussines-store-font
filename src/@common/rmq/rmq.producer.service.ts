import { Injectable } from '@nestjs/common';

import { AmqpClient } from './amqpClient';
import { RmqQueue } from '../constants/queues.constant';

@Injectable()
export class RmqProducerService {
  constructor(private readonly amqpClient: AmqpClient) {}

  async sendToQueue(queueName: RmqQueue, payload: any) {
    await this.amqpClient.produce(queueName, payload);
  }
}
