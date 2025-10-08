import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';
import moment from 'moment';

const allowedOperators = ['gt', 'gte', 'lt', 'lte', 'eq'];

export function IsDateFilterList(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isValidDateFilterList',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: string[]) {
          if (!value) return true;

          const filters = value.filter(Boolean);
          if (filters.length === 0 || filters.length > 2) return false;

          const isValidFilter = (filter: string) => {
            const beginsWithOperator = filter.match(
              /^(gt|gte|lt|lte|eq):(.*)$/,
            );
            if (beginsWithOperator) {
              const [op, dateStr] = filter.split(/:(.+)/);

              if (!allowedOperators.includes(op)) return false;
              if (!dateStr || !moment(dateStr, moment.ISO_8601, true).isValid())
                return false;

              return { op, date: dateStr };
            } else {
              if (!moment(filter, moment.ISO_8601, true).isValid())
                return false;

              return { op: 'eq', date: filter };
            }
          };

          const parsedFilters = filters.map(isValidFilter);

          if (parsedFilters.some((f) => f === false)) return false;
          if (filters.length === 1) return true;

          const [start, end] = parsedFilters as {
            op: string;
            date: string;
          }[];

          const validStart = ['gt', 'gte'].includes(start.op);
          const validEnd = ['lt', 'lte'].includes(end.op);

          return validStart && validEnd;
        },

        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be either: a single date or filter or two filters separated by a comma, where the first uses gt/gte and the second uses lt/lte`;
        },
      },
    });
  };
}
