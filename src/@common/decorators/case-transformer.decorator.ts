import { Transform } from 'class-transformer';

export function TransformToLowerCase() {
  return Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toLowerCase();
    }
    return value;
  });
}

export function TransformToUpperCase() {
  return Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toUpperCase();
    }
    return value;
  });
}
