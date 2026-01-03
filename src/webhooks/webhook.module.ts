import { Module } from "@nestjs/common";
import { WebhookEvent } from "../entities/webhook-event.entity";
import { WebhookEventService } from "./webhook-event.service";
import { WebhookRetryService } from "./webhook-retry.service";
import { WebhooksController } from "./webhook.controller";
import { WebhookService } from "./webhook.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { OrdersModule } from "../orders/orders.module";
import { TransactionModule } from "../transaction/transaction.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([WebhookEvent]),
    OrdersModule,
    TransactionModule
  ],
  controllers: [WebhooksController],
  providers: [
    WebhookEventService,
    WebhookRetryService,
    WebhookService,
  ],
  exports: [WebhookEventService, WebhookService, WebhookRetryService],
})
export class WebhookModule {}