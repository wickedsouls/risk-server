import { getPreciseAttackResults } from '../utils/';

describe('Precise attacks', () => {
  it('should attack with bigger army and win', () => {
    const { attackerArmy, defenderArmy } = getPreciseAttackResults(10, 5);
    expect(attackerArmy).toBe(5);
    expect(defenderArmy).toBe(0);
  });
  it('should attack with lower army and lose', () => {
    const { attackerArmy, defenderArmy } = getPreciseAttackResults(5, 10);
    expect(attackerArmy).toBe(0);
    expect(defenderArmy).toBe(5);
  });
  it('should lose when attacking same size army', () => {
    const { attackerArmy, defenderArmy } = getPreciseAttackResults(5, 5);
    expect(attackerArmy).toBe(0);
    expect(defenderArmy).toBe(1);
  });
});
