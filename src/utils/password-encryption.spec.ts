import { passwordEncryption } from './password-encription';
import * as bcrypt from 'bcrypt';

describe('password encryption', () => {
  const password = 'secret';
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
    const match = await passwordEncryption.verifyPassword('wrong', hash);
    expect(match).toBeFalsy();
  });
});
