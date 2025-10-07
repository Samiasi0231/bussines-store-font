import { UUID } from 'crypto';
import {
  DeepPartial,
  EntityManager,
  FindManyOptions,
  FindOneOptions,
  FindOptionsOrder,
  FindOptionsWhere,
  Repository,
  SelectQueryBuilder,
} from 'typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity.js';
import { Paginated } from '../types/pagination.type';

export class EntityRepository<T> extends Repository<T> {
  constructor(repo: Repository<T>) {
    super(repo.target, repo.manager, repo.queryRunner);
  }

  withManager(manager: EntityManager): this {
    const repo = manager.getRepository<T>(this.target);

    // Create a proxy that delegates calls to the manager repository
    return new Proxy(this, {
      get: (target, prop) => {
        // If the property exists on the derived repo, use it
        if (prop in target) {
          return (target as any)[prop];
        }
        // Otherwise, delegate to manager-bound repository
        const value = (repo as any)[prop];
        return typeof value === 'function' ? value.bind(repo) : value;
      },
    });
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
    options?: Omit<FindOneOptions<T>, 'where'>,
  ): Promise<T> {
    // const result = await this.createQueryBuilder()
    //   .update(updateData)
    //   .where('id = :id', { id })
    //   .returning('*')
    //   .execute();

    // return result?.raw?.[0];
    if (!id) return null;
    await this.update(id, updateData);
    const updatedRecord = await this.findById(id, options);
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

    return this.getPaginatedResults({ page, limit, total, records });
  }

  async paginateWithQuery(payload: {
    query?: SelectQueryBuilder<T>;
    pagination: {
      limit: number;
      page: number;
    };
    sort?: FindOptionsOrder<T>;
  }): Promise<Paginated<T>> {
    const { query, pagination, sort } = payload;

    const { limit, page } = pagination;
    const skip = (page - 1) * limit;

    const [records, total] = await query
      .skip(skip)
      .take(limit)
      .setFindOptions({ order: sort })
      .getManyAndCount();

    return this.getPaginatedResults({ page, limit, total, records });
  }

  private getPaginatedResults(data: {
    page: number;
    limit: number;
    total: number;
    records: T[];
  }) {
    const { page, limit, total, records } = data;
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
