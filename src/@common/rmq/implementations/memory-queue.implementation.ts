import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { EventEmitter } from 'events';
import { IMessageQueue } from '../interfaces/message-queue.interface';

interface QueuedMessage {
  queue: string;
  message: any;
  timestamp: number;
}

@Injectable()
export class MemoryQueue implements IMessageQueue, OnModuleDestroy {
  private readonly logger = new Logger(MemoryQueue.name);
  private eventEmitter: EventEmitter;
  private messageStore: Map<string, QueuedMessage[]> = new Map();
  private handlers: Map<string, Set<(message: any) => Promise<void> | void>> =
    new Map();

  constructor() {
    this.eventEmitter = new EventEmitter();
    this.eventEmitter.setMaxListeners(100); // Allow many listeners
  }

  async publish(queue: string, message: any): Promise<void> {
    this.logger.debug(`[x] Publishing message to queue: ${queue}`);

    // Store message for potential replay
    if (!this.messageStore.has(queue)) {
      this.messageStore.set(queue, []);
    }
    this.messageStore.get(queue)?.push({
      queue,
      message,
      timestamp: Date.now(),
    });

    // Emit event for immediate subscribers
    this.eventEmitter.emit(`queue:${queue}`, message);
  }

  async subscribe(
    queue: string,
    handler: (message: any) => Promise<void> | void,
  ): Promise<void> {
    this.logger.log(`Subscribing to queue: ${queue}`);

    // Register handler
    if (!this.handlers.has(queue)) {
      this.handlers.set(queue, new Set());
    }
    this.handlers.get(queue)?.add(handler);

    // Set up event listener
    const listener = async (message: any) => {
      try {
        await handler(message);
      } catch (error) {
        this.logger.error(
          `Error handling message from queue ${queue}:`,
          error,
        );
      }
    };

    this.eventEmitter.on(`queue:${queue}`, listener);

    // Process any existing messages in the queue
    const existingMessages = this.messageStore.get(queue) || [];
    for (const queuedMessage of existingMessages) {
      try {
        await handler(queuedMessage.message);
      } catch (error) {
        this.logger.error(
          `Error processing queued message from ${queue}:`,
          error,
        );
      }
    }
  }

  async unsubscribe(queue: string): Promise<void> {
    this.logger.log(`Unsubscribing from queue: ${queue}`);
    this.eventEmitter.removeAllListeners(`queue:${queue}`);
    this.handlers.delete(queue);
  }

  /**
   * Get queue statistics (useful for debugging)
   */
  getStats(): {
    queues: string[];
    messageCounts: Record<string, number>;
    handlerCounts: Record<string, number>;
  } {
    const queues = Array.from(this.messageStore.keys());
    const messageCounts: Record<string, number> = {};
    const handlerCounts: Record<string, number> = {};

    for (const queue of queues) {
      messageCounts[queue] = this.messageStore.get(queue)?.length || 0;
      handlerCounts[queue] = this.handlers.get(queue)?.size || 0;
    }

    return {
      queues,
      messageCounts,
      handlerCounts,
    };
  }

  /**
   * Clear all messages from a queue
   */
  clearQueue(queue: string): void {
    this.messageStore.delete(queue);
  }

  /**
   * Clear all queues
   */
  clearAll(): void {
    this.messageStore.clear();
    this.handlers.clear();
  }

  onModuleDestroy(): void {
    this.eventEmitter.removeAllListeners();
    this.clearAll();
  }
}

