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

  /**
   * Parses and validates sort parameters for database queries.
   *
   * Converts an array of sort strings (e.g., `['-createdAt', 'name']`)
   * into a key–direction mapping (e.g., `{ createdAt: -1, name: 1 }`),
   * allowing only predefined and safe fields.
   *
   *
   * @param {string[]} params - Array of sort parameters (prefix with '-' for descending).
   * @param {Record<string, string>} allowedSortFields - Mapping of allowed sort keys to database columns.
   *
   * @returns {Record<string, 'ASC' | 'DESC'>} An object representing valid sort fields and directions.
   *
   * @example
   * ```ts
   * const sort = Utils.parseSortParam(['-createdAt', 'name'], {
   *   createdAt: 'created_at',
   *   name: 'full_name'
   * });
   * // Result: { created_at: 'DESC', full_name: 'ASC' }
   * ```
   */
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

  /**
   * Parses a numeric range expression into a structured range filter.
   *
   * Accepts strings like:
   * - `"50"` → equality filter `{ type: 'eq', min: 50, max: 50 }`
   * - `"10:100"` → range filter `{ type: 'range', min: 10, max: 100 }`
   * - `"10:"` → greater-than-or-equal filter `{ type: 'gte', min: 10 }`
   * - `":100"` → less-than-or-equal filter `{ type: 'lte', max: 100 }`
   *
   * You can optionally pass a transform function that modifies numeric values
   * (e.g. rounding, scaling, converting currencies, etc.).
   *
   * @param {string} value - The numeric filter string.
   * @param {(val: number) => number} [transformFn] - Optional transform function applied to min/max values.
   * @returns {NumericRange | null} The parsed and transformed numeric range, or null if invalid.
   *
   * @example
   * ```ts
   * Utils.parseNumericRangeFilter('10:20');               // { type: 'range', min: 10, max: 20 }
   * Utils.parseNumericRangeFilter('10:20', Math.ceil);    // { type: 'range', min: 10, max: 20 } (rounded)
   * Utils.parseNumericRangeFilter('5', v => v * 1000);    // { type: 'eq', min: 5000, max: 5000 }
   * ```
   */
  static parseNumericRangeFilter(
    value: string,
    transformFn?: (val: number) => number,
  ): NumericRange | null {
    if (!value) return null;

    const trimmed = value.trim();

    // Single numeric value
    if (/^\d+(\.\d+)?$/.test(trimmed)) {
      let num = Number(trimmed);
      num = transformFn ? transformFn(num) : num;
      return { type: 'eq', min: num, max: num };
    }

    // Range format: "min:max"
    const match = trimmed.match(/^(\d+(\.\d+)?)?\s*:\s*(\d+(\.\d+)?)?$/);
    if (!match) return null;

    let min = match[1] ? Number(match[1]) : undefined;
    let max = match[3] ? Number(match[3]) : undefined;

    if (transformFn) {
      if (min !== undefined) min = transformFn(min);
      if (max !== undefined) max = transformFn(max);
    }

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
