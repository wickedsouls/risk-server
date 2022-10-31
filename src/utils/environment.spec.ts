import { isTestEnv } from './environment';

describe('environment', () => {
  it('should return test environment', () => {
    expect(isTestEnv).toBe(true);
  });
});
