import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { userStub } from '../../test/stubs/user.stub';

jest.mock('./users.service.ts');

describe('UsersController', () => {
  let controller: UsersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [UsersService],
    }).compile();
    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
  it('should call return all users', async () => {
    const users = await controller.getAllUsers();
    expect(users.length).toBe(1);
  });
  it('should call find user by id', async () => {
    const user = await controller.getUserById('id');
    expect(user).toBeDefined();
    expect(user.username).toEqual(userStub.user.username);
  });
  it('should call delete user', async () => {
    const id = await controller.deleteUser('123');
    expect(id).toBe('123');
  });
});
