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
    const [field1, field2] = args.constraints;
    const obj = args.object as any;

    const hasField1 = !!obj[field1];
    const hasField2 = !!obj[field2];

    // True if exactly one field is provided
    return hasField1 !== hasField2;
  }

  defaultMessage(args: ValidationArguments) {
    const [field1, field2] = args.constraints;
    return `Exactly one of '${field1}' or '${field2}' must be provided`;
  }
}

/**
 * Custom decorator to enforce mutual exclusivity between two fields.
 */
export function MutuallyExclusive(
  field1: string,
  field2: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [field1, field2],
      validator: MutuallyExclusiveConstraint,
    });
  };
}
