import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';
import { isFutureDate } from '../../../common/utils/date.util';

export function IsNotFutureDate(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isNotFutureDate',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          if (!value) return false;
          return !isFutureDate(value);
        },
        defaultMessage(args: ValidationArguments) {
          return 'La fecha de nacimiento no puede ser una fecha futura';
        },
      },
    });
  };
}
