import { FakerService } from './faker.service';
import { stringCheck } from '../utils/stringCheck';

describe('faker service', () => {
  const faker = new FakerService();
  it('should create new name', () => {
    const name = faker.createName();
    expect(name).toBeDefined();
    expect(stringCheck.hasUpperCase(name)).toBe(true);
  });
  it('should create different names', () => {
    const name1 = faker.createName();
    const name2 = faker.createName();
    expect(name1).not.toEqual(name2);
  });
  it('should create ip address', () => {
    const ip = faker.createIp();
    expect(ip).toBeDefined();
  });
});
