import { User } from '../../src/schemas/user.schema';

export const userStub: {
  user: User;
  userTwo: User;
} = {
  user: {
    username: 'user',
    password: 'secret',
    createdAt: Date.now(),
    lastLoginAt: Date.now(),
    firstName: 'firstName',
    lastName: 'lastName',
    email: 'user@mail.com',
  },
  userTwo: {
    username: 'user2',
    password: 'secret2',
    createdAt: Date.now(),
    lastLoginAt: Date.now(),
    firstName: 'firstName2',
    lastName: 'lastName2',
    email: 'user2@mail.com',
  },
};
