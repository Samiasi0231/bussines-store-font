import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { VersioningType, ValidationPipe, Logger } from '@nestjs/common';
import { json, urlencoded } from 'express';
import * as morgan from 'morgan-body';
import { TrimPipe } from './common/pipes/trim-pipe';
import { Environment } from './common/constants/environment.constant';
import helmet from 'helmet';
import { ConfigService } from '@nestjs/config';
import { APIVersion } from './common/constants/api-version.constant';
import { HttpInterceptor } from './common/interceptors/http.interceptor';
import { HttpExceptionFilter } from './common/filter/http-exception.filter';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(helmet());

  const config = app.get(ConfigService);

  const ENV = config.get<Environment>('ENV');
  const logger = new Logger('App');

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
  app.useGlobalFilters(new HttpExceptionFilter());

  app.useGlobalPipes(new TrimPipe());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      stopAtFirstError: true,
    }),
  );

  const LOG_FIELDS_TO_HIDE =
    config.get<string>('LOG_FIELDS_TO_HIDE')?.split(',') || [];

  (morgan as any)(app.getHttpAdapter().getInstance(), {
    prettify: false,
    filterParameters: LOG_FIELDS_TO_HIDE,
    stream: {
      write: (message: string) => {
        logger.log(message);
        return true;
      },
    },
  });

  const APP_PORT = config.get<string>('PORT');

  await app.listen(parseInt(APP_PORT, 10));
}
bootstrap();
