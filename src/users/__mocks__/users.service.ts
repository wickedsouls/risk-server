import { userStub } from '../../../test/stubs/user.stub';

export const UsersService = jest.fn().mockReturnValue({
  createUser: jest.fn().mockResolvedValue(userStub.user),
  getUserBy: jest.fn().mockResolvedValue(userStub.user),
  deleteUser: jest.fn().mockResolvedValue('123'),
  getAllUsers: jest.fn().mockResolvedValue([userStub.user]),
  findUserByName: jest.fn().mockResolvedValue(userStub.user),
});
