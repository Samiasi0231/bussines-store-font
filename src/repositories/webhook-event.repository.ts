import { InjectRepository } from '@nestjs/typeorm';
import { WebhookEvent } from '../entities/webhook-event.entity';
import { EntityRepository } from '../@common/database/entity.repository';
import { Repository } from 'typeorm';

export class WebhookEventRepository extends EntityRepository<WebhookEvent> {
  constructor(@InjectRepository(WebhookEvent) repo: Repository<WebhookEvent>) {
    super(repo);
  }
}
