import { CreateUserDto } from '../../src/users/dtos/create-user.dto';

export const authTokenStubs = () => {
  return { auth_token: '123' };
};

export const authCredentialsStubs: { user: CreateUserDto } = {
  user: {
    name: 'user',
    password: 'secret',
    firstName: 'firstName',
    lastName: 'lastName',
    email: 'email@email.com',
  },
};
