import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity.js';

export class EntityRepository<T> extends Repository<T> {
  constructor(repo: Repository<T>) {
    super(repo.target, repo.manager, repo.queryRunner);
  }

  async softDeleteById(id: string): Promise<void> {
    await this.softDelete(id);
  }

  async findById(id: string | number): Promise<T | null> {
    return this.findOne({ where: { id } as any });
  }

  async findbyIdAndUpdate(
    id: string | number,
    updateData: QueryDeepPartialEntity<T>,
  ): Promise<T> {
    const result = await this.createQueryBuilder()
      .update(updateData)
      .where('id = :id', { id })
      .returning('*')
      .execute();

    return result?.raw?.[0];
  }
}
