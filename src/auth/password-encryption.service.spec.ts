import { Test, TestingModule } from '@nestjs/testing';
import { PasswordEncryptionService } from './password-encryption.service';
import * as bcrypt from 'bcrypt';
import { ErrorMessages } from '../constants/errorMessages';

describe('password encryption', () => {
  let passwordEncryptionService: PasswordEncryptionService;
  const password = 'secret';

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PasswordEncryptionService],
    }).compile();

    passwordEncryptionService = module.get<PasswordEncryptionService>(
      PasswordEncryptionService,
    );
  });

  it('passwordEncryptionService should be defined', () => {
    expect(passwordEncryptionService).toBeDefined();
  });
  it('should hash the password', async () => {
    const hash = await passwordEncryptionService.hashPassword(password);
    expect(hash).toBeDefined();
    expect(hash).not.toBe(password);
  });
  it('should verify correct password', async () => {
    const hash = await bcrypt.hash(password, 11);
    const match = await passwordEncryptionService.verifyPassword(
      password,
      hash,
    );
    expect(match).toBe(true);
  });
  it('should not verify incorrect password', async () => {
    const hash = await bcrypt.hash(password, 11);
    await expect(
      passwordEncryptionService.verifyPassword('123', hash),
    ).rejects.toThrow(ErrorMessages.INVALID_CREDENTIALS);
  });
});
