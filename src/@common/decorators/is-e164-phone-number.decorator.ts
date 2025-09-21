import { registerDecorator } from 'class-validator';
import {
  parsePhoneNumberFromString,
  isValidPhoneNumber,
} from 'libphonenumber-js';
import { ValidationOptions } from 'class-validator/types/decorator/ValidationOptions';

export function IsE164PhoneNumber(
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isE164PhoneNumber',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          const phoneNumberToCheck = `+${value}`;

          const phoneNumber = parsePhoneNumberFromString(phoneNumberToCheck);

          const isValid = isValidPhoneNumber(phoneNumberToCheck);

          if (
            phoneNumber?.country === 'NG' &&
            phoneNumber?.nationalNumber.length !== 10
          ) {
            return false;
          }

          return phoneNumber?.number == phoneNumberToCheck && isValid;
        },
      },
    });
  };
}
