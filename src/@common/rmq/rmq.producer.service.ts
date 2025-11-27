import { Injectable } from '@nestjs/common';
import { MessageQueueService } from './message-queue.service';
import { RmqQueue } from '../constants/queues.constant';

@Injectable()
export class RmqProducerService {
  constructor(private readonly messageQueueService: MessageQueueService) {}

  async publish(queueName: RmqQueue, payload: any) {
    await this.messageQueueService.publish(queueName, payload);
  }
}
