import 'dotenv/config';
import * as amqplib from 'amqplib';
import { URL } from 'url';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SERVER_NAME } from '../constants/server.constant';

@Injectable()
export class AmqpClient {
  private conn: amqplib.ChannelModel | undefined;

  private producerChannel: amqplib.Channel | undefined;

  private connectionUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.connectionUrl = this.configService.get<string>('rmq.url');
  }

  async onModuleInit() {
    await this.initConnection('server');
  }

  /**
   * Get connection URL for reuse in other services
   */
  getConnectionUrl(): string {
    return this.connectionUrl;
  }

  /**
   * Get socket options that match this client's connection settings
   */
  getSocketOptions() {
    const { hostname } = new URL(this.connectionUrl);
    return {
      clientProperties: {
        connection_name: `${SERVER_NAME}:consumer`,
      },
      servername: hostname,
    };
  }

  async initConnection(connectionName?: string) {
    const url = this.connectionUrl;
    if (!this.conn) {
      const { hostname } = new URL(url);
      this.conn = await amqplib.connect(url, {
        servername: hostname,
        clientProperties: {
          connection_name: `${SERVER_NAME}:${connectionName}`,
        },
      });
    }
  }

  public async getProducerChannel(): Promise<amqplib.Channel> {
    if (!this.producerChannel) {
      this.producerChannel = await this.conn.createChannel();
    }
    return this.producerChannel as amqplib.Channel;
  }

  async produce(
    queue: string,
    message: { [key: string]: any },
    queueOptions?: amqplib.Options.AssertQueue,
    messageOptions?: amqplib.Options.Publish,
  ): Promise<void> {
    await this.initConnection();
    this.producerChannel = await this.getProducerChannel();
    await this.producerChannel.assertQueue(queue, {
      ...queueOptions,
      durable: true,
    });
    this.producerChannel.sendToQueue(
      queue,
      Buffer.from(JSON.stringify(message)),
      {
        ...messageOptions,
        persistent: true,
      },
    );
    Logger.log(`[x] Sent message to ${queue}`);
  }
}
