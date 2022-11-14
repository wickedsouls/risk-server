import * as bcrypt from 'bcrypt';

export const passwordEncryption = {
  hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 11);
  },
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  },
};
