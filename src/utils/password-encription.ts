import { ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { HttpErrors } from '../constants/errors';

export const passwordEncryption = {
  hashPassword(password: string) {
    return bcrypt.hash(password, 11);
  },
  async verifyPassword(password: string, hash: string) {
    const match = await bcrypt.compare(password, hash);
    if (!match) {
      throw new ForbiddenException(HttpErrors.INVALID_CREDENTIALS);
    }
    return true;
  },
};
