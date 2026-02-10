import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';
import { isPastDate } from '../../../common/utils/date.util';

export function IsNotPastDate(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isNotPastDate',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          if (!value) return true; // Si es opcional, permitir null/undefined
          return !isPastDate(value);
        },
        defaultMessage(args: ValidationArguments) {
          return 'La fecha programada no puede ser anterior a hoy';
        },
      },
    });
  };
}
