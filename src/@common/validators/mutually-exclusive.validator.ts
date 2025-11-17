import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ async: false })
export class MutuallyExclusiveConstraint
  implements ValidatorConstraintInterface
{
  validate(_: any, args: ValidationArguments) {
    const fields = args.constraints as string[];
    const obj = args.object as any;

    // Count how many fields are provided (truthy values)
    const providedFields = fields.filter((field) => !!obj[field]);

    // True if exactly one field is provided
    return providedFields.length === 1;
  }

  defaultMessage(args: ValidationArguments) {
    const fields = args.constraints as string[];
    const fieldList =
      fields.length === 2
        ? `'${fields[0]}' or '${fields[1]}'`
        : fields.map((f) => `'${f}'`).join(', ');
    return `Exactly one of ${fieldList} must be provided`;
  }
}

/**
 * Custom decorator to enforce mutual exclusivity between two or more fields.
 * Ensures exactly one of the specified fields is provided.
 *
 * @param fields - Array of field names that should be mutually exclusive (minimum 2 fields required)
 * @param validationOptions - Optional validation options
 *
 * @example
 * ```typescript
 * @MutuallyExclusive(['address', 'addressId'])
 * @MutuallyExclusive(['userId', 'email', 'phone'])
 * ```
 */
export function MutuallyExclusive(
  fields: string[],
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    if (!Array.isArray(fields) || fields.length < 2) {
      throw new Error(
        'MutuallyExclusive requires an array with at least 2 fields',
      );
    }

    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: fields,
      validator: MutuallyExclusiveConstraint,
    });
  };
}
