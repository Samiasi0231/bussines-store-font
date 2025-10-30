import { Transform } from 'class-transformer';

/**
 * Transforms a single string (comma-separated) or any value into an array.
 * Optionally applies a map function to each element.
 */
export function TransformToArray<T = any>(mapFn?: (value: any) => T) {
  return Transform(({ value }) => {
    if (value == null) return [];

    let arr: any[] = [];
    if (Array.isArray(value)) arr = value;
    else if (typeof value === 'string')
      arr = value
        .split(',')
        .map((v) => v.trim())
        .filter((v) => v.length > 0);
    else arr = [value];

    return mapFn ? arr.map(mapFn) : arr;
  });
}
