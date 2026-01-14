import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { Logger, VersioningType, ValidationPipe } from '@nestjs/common';
import { json, urlencoded } from 'express';
// import morgan from 'morgan-body';
import { TrimPipe } from './@common/pipes/trim-pipe';
import { Environment } from './@common/constants/environment.constant';
import helmet from 'helmet';
import { ConfigService } from '@nestjs/config';
import { APIVersion } from './@common/constants/api-version.constant';
import { HttpInterceptor } from './@common/interceptors/http.interceptor';
import { RequestLoggingInterceptor } from './@common/interceptors/request-logging.interceptor';
import { RequestIdMiddleware } from './@common/middleware/request-id.middleware';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { RmqDeserializer } from './@common/microservices/rmq-queue-pattern.deserializer';
import { RmqQueue } from './@common/constants/queues.constant';
import { AmqpClient } from './@common/rmq/amqp-client';
import { SwaggerConfig } from './@common/swagger/swagger.config';
import { MulterExceptionFilter } from './@common/filter/multer-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(helmet());

  const config = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  const ENV = config.get<Environment>('ENV');

  app.get(HttpAdapterHost);
  
  // Add request ID middleware (must be before other middleware)
  app.use(new RequestIdMiddleware().use.bind(new RequestIdMiddleware()));
  
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  app.enableCors({
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }
      
      if (ENV !== Environment.PRODUCTION) {
        return callback(null, true);
      }
      

      const corsOrigins = config.get<string>('CORS_ORIGINS');
      if (!corsOrigins) {
      
        return callback(new Error('CORS_ORIGINS must be configured in production'));
      }
      
      const allowedOrigins = corsOrigins.split(',').map((o) => o.trim());
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      callback(new Error('Not allowed by CORS'));
    },
    credentials: false,
  });

  app.setGlobalPrefix('api');

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: APIVersion.ONE,
  });

  // Add request logging interceptor first to log all requests
  app.useGlobalInterceptors(new RequestLoggingInterceptor());
  app.useGlobalInterceptors(new HttpInterceptor());
  app.useGlobalFilters(new MulterExceptionFilter());
  app.useGlobalPipes(new TrimPipe());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      stopAtFirstError: true,
      transform: true,
    }),
  );

 

 
  const queueType = config.get<string>('queue.type') || 'memory';
  const rabbitMQEnabled = config.get<boolean>('queue.rabbitmq.enabled');
  const amqpUrl = config.get<string>('AMQP_URL');

 
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
