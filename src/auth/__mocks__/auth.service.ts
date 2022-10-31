import { authTokenStubs } from '../../../test/stubs/auth.stubs';

export const AuthService = jest.fn().mockReturnValue({
  login: jest.fn().mockResolvedValue(authTokenStubs()),
  register: jest.fn().mockResolvedValue({}),
});
