import { SelectQueryBuilder } from 'typeorm';
import { Util } from './helpers.utility';

export interface NumericRange {
  type: 'eq' | 'gte' | 'lte' | 'range';
  min?: number;
  max?: number;
}

type RangeOperator = 'gt' | 'gte' | 'lt' | 'lte' | 'eq';

export interface RangeBound {
  operator: RangeOperator;
  value: Date;
}

export interface ParsedRangeFilter {
  from?: RangeBound;
  to?: RangeBound;
  eq?: RangeBound;
}

const OPERATOR_MAP: Record<string, string> = {
  eq: '=',
  gt: '>',
  gte: '>=',
  lt: '<',
  lte: '<=',
  ne: '!=',
};

export class QueryUtil {
  /**
   * Applies a numeric or date range filter to a query based on a parsed range object.
   * The parsed filter can contain:
   *   - eq  → exact match
   *   - from → lower bound
   *   - to → upper bound
   */

  static applyRangeFilter<T>(
    query: SelectQueryBuilder<T>,
    table: string,
    column: string,
    filter: ParsedRangeFilter,
  ) {
    if (!filter) return query;

    if (filter.eq) {
      const sqlOp = OPERATOR_MAP[filter.eq.operator] || '=';
      query = query.andWhere(`${table}.${column} ${sqlOp} :${column}Eq`, {
        [`${column}Eq`]: filter.eq.value,
      });
      return query;
    }

    if (filter.from) {
      const sqlOp = OPERATOR_MAP[filter.from.operator] || '>=';
      query = query.andWhere(`${table}.${column} ${sqlOp} :${column}From`, {
        [`${column}From`]: filter.from.value,
      });
    }

    if (filter.to) {
      const sqlOp = OPERATOR_MAP[filter.to.operator] || '<=';
      query = query.andWhere(`${table}.${column} ${sqlOp} :${column}To`, {
        [`${column}To`]: filter.to.value,
      });
    }

    return query;
  }

  /**
   * Applies numeric range filters to a query builder.
   */
  static applyNumericRangeFilter<T>(
    query: SelectQueryBuilder<T>,
    table: string,
    column: string,
    range: ReturnType<typeof Util.parseNumericRangeFilter>,
  ) {
    if (!range) return query;

    const { min, max } = range;

    if (min !== undefined && max !== undefined)
      query = query.andWhere(
        `${table}.${column} BETWEEN :${column}Min AND :${column}Max`,
        {
          [`${column}Min`]: min,
          [`${column}Max`]: max,
        },
      );
    else if (min !== undefined)
      query = query.andWhere(`${table}.${column} >= :${column}Min`, {
        [`${column}Min`]: min,
      });
    else if (max !== undefined)
      query = query.andWhere(`${table}.${column} <= :${column}Max`, {
        [`${column}Max`]: max,
      });

    return query;
  }
}
