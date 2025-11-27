import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Environment } from '../constants/environment.constant';

export class SwaggerConfig {
  static setup(app: INestApplication, configService: ConfigService): void {
    const env = configService.get<Environment>('ENV');
    const appName = configService.get<string>('APP_NAME') || 'BizVantage API';
    const appVersion = configService.get<string>('APP_VERSION') || '1.0.0';
    const apiPrefix = configService.get<string>('API_PREFIX') || 'api';

    const config = new DocumentBuilder()
      .setTitle(appName)
      .setDescription(
        `The BizVantage API documentation. This API provides endpoints for managing users, businesses, products, orders, invoices, and transactions.`,
      )
      .setVersion(appVersion)
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        'JWT-auth',
      )
      .addApiKey(
        {
          type: 'apiKey',
          in: 'header',
          name: 'X-API-Key',
        },
        'api-key',
      )
      .addTag('Auth', 'Authentication endpoints')
      .addTag('Users', 'User management endpoints')
      .addTag('Business', 'Business management endpoints')
      .addTag('Products', 'Product management endpoints')
      .addTag('Orders', 'Order management endpoints')
      .addTag('Invoices', 'Invoice management endpoints')
      .addTag('Transactions', 'Transaction management endpoints')
      .addTag('Coupons', 'Coupon management endpoints')
      .addTag('Storefront', 'Storefront management endpoints')
      .addTag('KYC', 'KYC verification endpoints')
      .addTag('Wallet', 'Wallet management endpoints')
      .addServer(`/${apiPrefix}/v1`, 'Version 1')
      .build();

    const document = SwaggerModule.createDocument(app, config, {
      operationIdFactory: (controllerKey: string, methodKey: string) =>
        methodKey,
    });

    // Only enable Swagger in non-production environments
    if (env !== Environment.PRODUCTION) {
      const swaggerPath = configService.get<string>('SWAGGER_PATH') || 'docs';
      SwaggerModule.setup(swaggerPath, app, document, {
        swaggerOptions: {
          persistAuthorization: true,
          tagsSorter: 'alpha',
          operationsSorter: 'alpha',
        },
        customSiteTitle: `${appName} - API Documentation`,
      });
    }
  }
}

