import { isValidObjectId } from 'mongoose';
import { BadRequestException } from '@nestjs/common';
import { HttpErrors } from '../constants/errors';

export const ValidateMongoId = (): MethodDecorator => {
  return function (
    target: object,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;
    descriptor.value = function (...args: string[]) {
      const [id] = args;
      if (!id || !isValidObjectId(id)) {
        throw new BadRequestException(HttpErrors.INVALID_ID);
      }
      return originalMethod.apply(this, args);
    };
  };
};
