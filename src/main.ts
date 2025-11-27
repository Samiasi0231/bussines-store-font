import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { Logger, VersioningType, ValidationPipe } from '@nestjs/common';
import { json, urlencoded } from 'express';
import morgan from 'morgan-body';
import { TrimPipe } from './@common/pipes/trim-pipe';
import { Environment } from './@common/constants/environment.constant';
import helmet from 'helmet';
import { ConfigService } from '@nestjs/config';
import { APIVersion } from './@common/constants/api-version.constant';
import { HttpInterceptor } from './@common/interceptors/http.interceptor';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { RmqDeserializer } from './@common/microservices/rmq-queue-pattern.deserializer';
import { RmqQueue } from './@common/constants/queues.constant';
import { AmqpClient } from './@common/rmq/amqp-client';
import { SwaggerConfig } from './@common/swagger/swagger.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(helmet());

  const config = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  const ENV = config.get<Environment>('ENV');

  app.get(HttpAdapterHost);
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  app.enableCors({
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    origin: [], //TODO: update after deployment
    credentials: false,
    ...(ENV !== Environment.PRODUCTION && {
      origin: '*',
      credentials: true,
    }),
  });

  app.setGlobalPrefix('api');

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: APIVersion.ONE,
  });

  app.useGlobalInterceptors(new HttpInterceptor());

  app.useGlobalPipes(new TrimPipe());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      stopAtFirstError: true,
      transform: true,
    }),
  );

  const LOG_FIELDS_TO_HIDE =
    config.get<string>('LOG_FIELDS_TO_HIDE')?.split(',') || [];

  // Configure morgan-body to avoid interfering with exception filter
  // Disable response body logging to prevent wrapping response.send() which causes ERR_HTTP_HEADERS_SENT
  (morgan as any)(app.getHttpAdapter().getInstance(), {
    prettify: false,
    filterParameters: LOG_FIELDS_TO_HIDE,
    logReqBody: false, // Disable request body logging
    logResBody: false, // Disable response body logging - this prevents wrapping response.send()
    skip: (req: any, res: any) => {
      // Skip logging if headers have already been sent
      return res.headersSent;
    },
    stream: {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      write: (message: string) => {
        // logger.log(message);
        return true;
      },
    },
  });

  // Configure message queue (RabbitMQ or in-memory)
  const queueType = config.get<string>('queue.type') || 'memory';
  const rabbitMQEnabled = config.get<boolean>('queue.rabbitmq.enabled');
  const amqpUrl = config.get<string>('AMQP_URL');

  // Only connect to RabbitMQ microservices if explicitly enabled
  if (queueType === 'rabbitmq' && rabbitMQEnabled && amqpUrl) {
    let socketOptions: any;

    try {
      const amqpClient = app.get(AmqpClient, { strict: false });
      if (amqpClient) {
        const clientUrl = amqpClient.getConnectionUrl() || amqpUrl;
        socketOptions = amqpClient.getSocketOptions();

        const queues = Object.values(RmqQueue);

        for (const queue of queues) {
          const deserializer = new RmqDeserializer();
          deserializer.setPattern(queue);

          app.connectMicroservice<MicroserviceOptions>({
            transport: Transport.RMQ,
            options: {
              urls: [clientUrl],
              queue: queue.trim(),
              noAssert: false,
              prefetchCount: 50,
              noAck: true,
              deserializer,
              queueOptions: {
                durable: true,
              },
              ...(socketOptions && {
                socketOptions: {
                  connectionOptions: socketOptions,
                },
              }),
            },
          });
        }

        await app.startAllMicroservices();
        logger.log(
          `RabbitMQ consumers connected to queues: ${queues.join(', ')}`,
        );
      }
    } catch (error) {
      logger.warn(
        'Failed to connect to RabbitMQ, falling back to in-memory queue',
      );
    }
  } else {
    logger.log('Using in-memory message queue (RabbitMQ not enabled)');
  }

  // Setup Swagger documentation
  SwaggerConfig.setup(app, config);
  if (ENV !== Environment.PRODUCTION) {
    const swaggerPath = config.get<string>('SWAGGER_PATH') || 'docs';
    logger.log(`Swagger documentation available at /${swaggerPath}`);
  }

  // await app.startAllMicroservices();
  // logger.log(`RabbitMQ consumers connected to queues: ${queues.join(', ')}`);

  const APP_PORT = config.get<string>('PORT');
  await app.listen(parseInt(APP_PORT, 10));
  logger.log(`Application is running on: http://localhost:${APP_PORT}/api/v1`);
}
bootstrap();
