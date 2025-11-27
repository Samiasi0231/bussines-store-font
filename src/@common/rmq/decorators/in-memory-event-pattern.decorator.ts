import { SetMetadata } from '@nestjs/common';
import { RmqQueue } from '../../constants/queues.constant';

export const IN_MEMORY_EVENT_PATTERN = 'in-memory-event-pattern';

/**
 * Decorator for handling in-memory queue events
 * Use this alongside @EventPattern when using in-memory queues
 */
export const InMemoryEventPattern = (pattern: RmqQueue | string) =>
  SetMetadata(IN_MEMORY_EVENT_PATTERN, pattern);

