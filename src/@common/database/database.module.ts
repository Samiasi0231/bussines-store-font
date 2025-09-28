import { Module } from '@nestjs/common';
import { DbTransactionManager } from './database-transaction.manager';

@Module({
  providers: [DbTransactionManager],
  exports: [DbTransactionManager],
})
export class DatabaseModule {}
