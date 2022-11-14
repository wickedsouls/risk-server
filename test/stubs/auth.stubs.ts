import { CreateUserDto } from '../../src/users/dtos/create-user.dto';

export const authTokenStubs = () => {
  return { auth_token: '123' };
};

export const authCredentialsStubs: { user: CreateUserDto } = {
  user: {
    username: 'user',
    password: 'secret',
    firstName: 'firstName',
    lastName: 'lastName',
    email: 'email@email.com',
  },
};

export const registrationStubs: { user: CreateUserDto } = {
  user: {
    username: 'user1',
    password: 'secret',
    email: 'user@emailc.com',
  },
};
