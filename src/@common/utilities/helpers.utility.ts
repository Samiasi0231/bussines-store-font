import moment from 'moment';
import { Environment } from '../constants/environment.constant';
import argon2 from 'argon2';

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

export class Util {
  static isProduction(): boolean {
    return Environment.PRODUCTION === String(process.env.ENV).toLowerCase();
  }

  static hash(value: string): Promise<string> {
    return argon2.hash(value);
  }

  /**
   * Asynchronously tests a value[password] against a hash.
   * @param  hash     Hash to test against
   * @param  value value to test
   *
   * @return Promise, boolean
   */

  static async verifyHash(hash: string, value: string): Promise<boolean> {
    return argon2.verify(hash, value);
  }

  static toKobo(amount: number): number {
    return amount * 100;
  }

  static toNaira(amount: number): number {
    return amount / 100;
  }

  static parseSortParam = (
    params: string[],
    allowedSortFields: Record<string, string>,
  ): Record<string, 1 | -1> => {
    if (!params) {
      params = ['-createdAt'];
      allowedSortFields = { createdAt: 'createdAt' };
    }

    const sortFilter: Record<string, 1 | -1> = {};

    params.forEach((param) => {
      const direction = param.startsWith('-') ? -1 : 1;
      const field = param.replace(/^[-+]/, '');

      const schemaField = allowedSortFields[field];
      if (schemaField) sortFilter[schemaField] = direction;
    });

    return sortFilter;
  };

  static parseNumericRangeFilter(value: string): NumericRange | null {
    if (!value) return null;

    const trimmed = value.trim();

    if (/^\d+(\.\d+)?$/.test(trimmed)) {
      const num = Number(trimmed);
      return { type: 'eq', min: num, max: num };
    }

    const match = trimmed.match(/^(\d+(\.\d+)?)?\s*:\s*(\d+(\.\d+)?)?$/);
    if (!match) return null;

    const min = match[1] ? Number(match[1]) : undefined;
    const max = match[3] ? Number(match[3]) : undefined;

    if (min !== undefined && max !== undefined)
      return { type: 'range', min, max };
    if (min !== undefined) return { type: 'gte', min };
    if (max !== undefined) return { type: 'lte', max };

    return null;
  }

  /**
   * Parse a date filter array like:
   *  - ["gte:2025-01-01","lt:2025-01-31"]
   *  - ["2025-01-01"]
   *  - ["gte:2025-01-01"]
   *  - ["lt:2025-01-31"]
   *  - ["gte:2025-01-01","lte:2025-01-31"]
   */
  static parseDateFilter(value: string[]): ParsedRangeFilter | null {
    if (!value) return null;

    const filters = value.filter(Boolean);

    const allowedOps: RangeOperator[] = ['gt', 'gte', 'lt', 'lte', 'eq'];
    const result: ParsedRangeFilter = {};

    const parseSingle = (str: string): RangeBound => {
      const beginsWithOperator = str.match(/^(gt|gte|lt|lte|eq):(.*)$/);
      if (!beginsWithOperator) {
        if (!moment(str, moment.ISO_8601, true).isValid()) {
          throw new Error(`Invalid date: ${str}`);
        }
        return { operator: 'eq', value: new Date(str) };
      }

      const [op, dateStr] = str.split(/:(.+)/);
      if (!allowedOps.includes(op as RangeOperator)) {
        throw new Error(`Invalid operator: ${op}`);
      }
      if (!moment(dateStr, moment.ISO_8601, true).isValid()) {
        throw new Error(`Invalid date: ${dateStr}`);
      }
      return { operator: op as RangeOperator, value: new Date(dateStr) };
    };

    if (filters.length === 1) {
      const f = parseSingle(filters[0]);
      if (['gt', 'gte'].includes(f.operator)) result.from = f;
      else if (['lt', 'lte'].includes(f.operator)) result.to = f;
      else result.eq = f;
    } else if (filters.length === 2) {
      const first = parseSingle(filters[0]);
      const second = parseSingle(filters[1]);

      if (!['gt', 'gte'].includes(first.operator))
        throw new Error(`First operator must be gt or gte`);
      if (!['lt', 'lte'].includes(second.operator))
        throw new Error(`Second operator must be lt or lte`);

      result.from = first;
      result.to = second;
    } else {
      throw new Error(`Too many date filters — only one or two allowed`);
    }

    return result;
  }
}
