import 'dotenv/config';
import * as amqplib from 'amqplib';
import { URL } from 'url';
import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IMessageQueue } from '../interfaces/message-queue.interface';
import { SERVER_NAME } from '../../constants/server.constant';

@Injectable()
export class RabbitMQQueue implements IMessageQueue, OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQQueue.name);
  private conn: amqplib.Connection | null = null;
  private producerChannel: amqplib.Channel | undefined;
  private consumerChannels: Map<string, amqplib.Channel> = new Map();
  private connectionUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.connectionUrl = this.configService.get<string>('AMQP_URL') || '';
  }

  async onModuleInit() {
    if (!this.connectionUrl) {
      this.logger.warn('AMQP_URL not configured, RabbitMQ queue will not be available');
      return;
    }

    try {
      await this.initConnection();
    } catch (error) {
      this.logger.error('Failed to initialize RabbitMQ connection:', error);
    }
  }

  private async initConnection(connectionName: string = 'server'): Promise<void> {
    if (!this.conn) {
      const { hostname } = new URL(this.connectionUrl);
      const connection = await amqplib.connect(this.connectionUrl, {
        servername: hostname,
        clientProperties: {
          connection_name: `${SERVER_NAME}:${connectionName}`,
        },
      });
      this.conn = connection as any; // Type assertion for compatibility
      this.logger.log('RabbitMQ connection established');
    }
  }

  private async getProducerChannel(): Promise<amqplib.Channel> {
    if (!this.producerChannel) {
      if (!this.conn) {
        await this.initConnection();
      }
      if (this.conn) {
        this.producerChannel = await (this.conn as any).createChannel();
      }
    }
    return this.producerChannel!;
  }

  async publish(queue: string, message: any): Promise<void> {
    if (!this.connectionUrl) {
      this.logger.warn(`Cannot publish to ${queue}: RabbitMQ not configured`);
      return;
    }

    try {
      const channel = await this.getProducerChannel();
      await channel.assertQueue(queue, {
        durable: true,
      });

      channel.sendToQueue(
        queue,
        Buffer.from(JSON.stringify(message)),
        {
          persistent: true,
        },
      );

      this.logger.debug(`[x] Sent message to ${queue}`);
    } catch (error) {
      this.logger.error(`Error publishing to queue ${queue}:`, error);
      throw error;
    }
  }

  async subscribe(
    queue: string,
    handler: (message: any) => Promise<void> | void,
  ): Promise<void> {
    if (!this.connectionUrl) {
      this.logger.warn(`Cannot subscribe to ${queue}: RabbitMQ not configured`);
      return;
    }

    try {
      if (!this.conn) {
        await this.initConnection('consumer');
      }

      const channel = await (this.conn as any).createChannel();
      this.consumerChannels.set(queue, channel);

      await channel.assertQueue(queue, {
        durable: true,
      });

      await channel.consume(queue, async (msg) => {
        if (msg) {
          try {
            const content = JSON.parse(msg.content.toString());
            await handler(content);
            channel.ack(msg);
          } catch (error) {
            this.logger.error(`Error processing message from ${queue}:`, error);
            channel.nack(msg, false, false); // Reject and don't requeue
          }
        }
      });

      this.logger.log(`Subscribed to queue: ${queue}`);
    } catch (error) {
      this.logger.error(`Error subscribing to queue ${queue}:`, error);
      throw error;
    }
  }

  async unsubscribe(queue: string): Promise<void> {
    const channel = this.consumerChannels.get(queue);
    if (channel) {
      await channel.close();
      this.consumerChannels.delete(queue);
      this.logger.log(`Unsubscribed from queue: ${queue}`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    // Close all consumer channels
    for (const [queue, channel] of this.consumerChannels.entries()) {
      try {
        await channel.close();
      } catch (error) {
        this.logger.error(`Error closing channel for queue ${queue}:`, error);
      }
    }
    this.consumerChannels.clear();

    // Close producer channel
    if (this.producerChannel) {
      try {
        await this.producerChannel.close();
      } catch (error) {
        this.logger.error('Error closing producer channel:', error);
      }
    }

    // Close connection
    if (this.conn) {
      try {
        await (this.conn as any).close();
        this.conn = null;
        this.logger.log('RabbitMQ connection closed');
      } catch (error) {
        this.logger.error('Error closing RabbitMQ connection:', error);
      }
    }
  }
}

