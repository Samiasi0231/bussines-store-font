import { Transform } from 'class-transformer';

export function TransformToArray() {
  return Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((v) => v.trim())
        .filter((v) => v.length > 0);
    }
    return [];
  });
}
