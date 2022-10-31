import { DatabaseProduction } from './DatabaseProduction';
import { DatabaseTest } from './DatabaseTest';

describe('database', () => {
  it('production database should defined', () => {
    expect(DatabaseProduction).toBeDefined();
  });
  it('test database should defined', () => {
    expect(DatabaseTest).toBeDefined();
  });
});
