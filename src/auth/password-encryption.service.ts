import { ForbiddenException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { ErrorMessages } from '../constants/errorMessages';

@Injectable()
export class PasswordEncryptionService {
  hashPassword(password: string) {
    return bcrypt.hash(password, 11);
  }
  async verifyPassword(password: string, hash: string) {
    const match = await bcrypt.compare(password, hash);
    if (!match) {
      throw new ForbiddenException(ErrorMessages.INVALID_CREDENTIALS);
    }
    return true;
  }
}
