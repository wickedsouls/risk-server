import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { authCredentialsStubs } from '../../test/stubs/auth.stubs';

jest.mock('./auth.service.ts');

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [AuthService],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
  it('should call login service', async () => {
    const token = await controller.login(authCredentialsStubs.user);
    expect(token).toBeDefined();
  });
  it('should call register service', async () => {
    const data = await controller.register(authCredentialsStubs.user);
    expect(data).toBeDefined();
  });
});
