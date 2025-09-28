import { UUID } from 'crypto';
import {
  DeepPartial,
  EntityManager,
  FindManyOptions,
  FindOneOptions,
  FindOptionsOrder,
  FindOptionsWhere,
  Repository,
} from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity.js';
import { Paginated } from '../types/pagination.type';

export class EntityRepository<T> extends Repository<T> {
  constructor(repo: Repository<T>) {
    super(repo.target, repo.manager, repo.queryRunner);
  }

  withManager(manager: EntityManager): this {
    const repo = manager.getRepository<T>(this.target);
    // Preserve the actual class of `this` (derived repository)
    const derivedRepo = Object.create(this.constructor.prototype) as this;
    // Copy the repository state from the manager's repository
    Object.assign(derivedRepo, repo);

    return derivedRepo;
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
    options?: Omit<FindOneOptions<T>, 'where'>,
  ): Promise<T | null> {
    if (!id) return null;
    return this.findOne({ ...options, where: { id } as any });
  }

  async findbyIdAndUpdate(
    id: UUID | number,
    updateData: QueryDeepPartialEntity<T>,
  ): Promise<T> {
    // const result = await this.createQueryBuilder()
    //   .update(updateData)
    //   .where('id = :id', { id })
    //   .returning('*')
    //   .execute();

    // return result?.raw?.[0];
    if (!id) return null;
    await this.update(id, updateData);
    const updatedRecord = await this.findById(id);
    return updatedRecord;
  }

  async paginate(payload: {
    filter?: FindOptionsWhere<T>;
    pagination: {
      limit: number;
      page: number;
    };
    sort?: FindOptionsOrder<T>;
    options?: Omit<FindManyOptions<T>, 'where' | 'order' | 'take' | 'skip'>;
  }): Promise<Paginated<T>> {
    const { filter, pagination, options, sort } = payload;

    const { limit, page } = pagination;
    const skip = (page - 1) * limit;

    const [records, total] = await this.findAndCount({
      ...options,
      where: filter,
      order: sort,
      take: limit,
      skip,
    });

    const totalPages = Math.ceil(total / limit);
    const currentPage = page;
    const nextPage = currentPage + 1 <= totalPages ? currentPage + 1 : null;
    const prevPage = currentPage - 1 > 0 ? currentPage - 1 : null;

    return {
      results: records,
      pagination: {
        total,
        totalPages,
        currentPage,
        nextPage,
        prevPage,
        hasNextPage: nextPage !== null,
        hasPrevPage: prevPage !== null,
      },
    };
  }
}
