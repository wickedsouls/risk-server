import { passwordEncryption } from './password-encription';
import * as bcrypt from 'bcrypt';
import { HttpErrors } from '../constants/errors';

describe('password encryption', () => {
  const password = 'secret';
  it('passwordEncryptionService should be defined', () => {
    expect(passwordEncryption).toBeDefined();
  });
  it('should hash the password', async () => {
    const hash = await passwordEncryption.hashPassword(password);
    expect(hash).toBeDefined();
    expect(hash).not.toBe(password);
  });
  it('should verify correct password', async () => {
    const hash = await bcrypt.hash(password, 11);
    const match = await passwordEncryption.verifyPassword(password, hash);
    expect(match).toBe(true);
  });
  it('should not verify incorrect password', async () => {
    const hash = await bcrypt.hash(password, 11);
    await expect(
      passwordEncryption.verifyPassword('123', hash),
    ).rejects.toThrow(HttpErrors.INVALID_CREDENTIALS);
  });
});
