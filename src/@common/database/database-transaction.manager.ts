import { DataSource, EntityManager, QueryRunner } from 'typeorm';
import { ErrorMessage } from '../constants/message.constant';
import { Injectable, Logger } from '@nestjs/common';
import EventEmitter from 'node:events';

@Injectable()
export class DbTransactionManager extends EventEmitter<{
  started: any;
  committed: any;
  aborted: any;
}> {
  private queryRunner?: QueryRunner;
  private readonly MAX_RETRIES = 5;
  entityManager: EntityManager;

  constructor(private readonly dataSource: DataSource) {
    super();
  }

  async startTransaction(): Promise<EntityManager> {
    if (this.queryRunner) {
      throw new Error(ErrorMessage.DB_TRANSACTION_ALREADY_STARTED);
    }

    this.queryRunner = this.dataSource.createQueryRunner();
    await this.queryRunner.connect();
    await this.queryRunner.startTransaction();
    this.entityManager = this.queryRunner.manager;
    this.emit('started');
    return this.queryRunner.manager;
  }

  async commitTransaction(): Promise<void> {
    if (!this.queryRunner) return;
    await this.queryRunner.commitTransaction();
    await this.queryRunner.release();
    this.queryRunner = undefined;
    this.emit('committed');
  }

  async rollbackTransaction(): Promise<void> {
    if (!this.queryRunner) return;
    await this.queryRunner.rollbackTransaction();
    await this.queryRunner.release();
    this.queryRunner = undefined;
    this.emit('aborted');
  }

  private isTransientError(err: any): boolean {
    const code = err?.code;
    return code === '40001' || code === '40P01'; // serialization failure / deadlock
  }

  async transaction<T = any>(
    callback: (manager: DbTransactionManager) => Promise<T>,
  ): Promise<T> {
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      const manager = new DbTransactionManager(this.dataSource);
      await manager.startTransaction();
      try {
        const result = await callback(manager);
        await manager.commitTransaction();
        return result;
      } catch (err: any) {
        await manager.rollbackTransaction();

        if (this.isTransientError(err) && attempt < this.MAX_RETRIES) {
          Logger.warn(
            `Transient error, retrying with a new transaction (attempt ${attempt})`,
          );
          continue;
        }

        throw err;
      }
    }
  }
}
