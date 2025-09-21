import { UUID } from 'crypto';
import { DeepPartial, FindOptionsRelations, Repository } from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity.js';

export class EntityRepository<T> extends Repository<T> {
  constructor(repo: Repository<T>) {
    super(repo.target, repo.manager, repo.queryRunner);
  }

  async createStrict(
    data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<T> {
    const entity = super.create(data as DeepPartial<T>);
    return this.save(entity);
  }

  async softDeleteById(id: UUID | number): Promise<void> {
    await this.softDelete(id);
  }

  async findById(
    id: UUID | number,
    relations?: FindOptionsRelations<T>,
  ): Promise<T | null> {
    return this.findOne({ where: { id } as any, relations });
  }

  async findbyIdAndUpdate(
    id: UUID | number,
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
