import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'isNumericRange', async: false })
class IsNumericRangeConstraint implements ValidatorConstraintInterface {
  private lastErrorCode?: string;

  validate(value: unknown): boolean {
    if (value === undefined || value === null) return true;

    if (typeof value !== 'string') return false;

    const v = value.trim();
    if (v.length === 0) return false;

    // Single numeric value
    if (/^\d+(\.\d+)?$/.test(v)) return true;

    // Range formats: "30:50", "30:", ":50"
    const rangeMatch = v.match(/^(\d+(\.\d+)?)?\s*:\s*(\d+(\.\d+)?)?$/);
    if (!rangeMatch) return false;

    const minStr = rangeMatch[1];
    const maxStr = rangeMatch[3];

    if (!minStr && !maxStr) return false;

    const min = minStr !== undefined ? Number(minStr) : undefined;
    const max = maxStr !== undefined ? Number(maxStr) : undefined;

    if ((minStr && Number.isNaN(min)) || (maxStr && Number.isNaN(max)))
      return false;

    if (min !== undefined && max !== undefined && min > max) {
      this.lastErrorCode = 'minGreaterThanMax';
      return false;
    }

    return true;
  }

  defaultMessage(args: ValidationArguments) {
    if (this.lastErrorCode === 'minGreaterThanMax')
      return `The minimum value in "${args.property}" cannot be greater than the maximum value.`;

    return `${args.property} must be a number or a valid range (e.g. "30:50", "30:", ":50")`;
  }
}

export function IsNumericRange(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: IsNumericRangeConstraint,
    });
  };
}
