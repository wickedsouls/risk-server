import Chance from 'chance';

export const faker = {
  chance: new Chance(),
  createName() {
    const word1 = this.chance.word();
    const word2 = this.chance.word();
    const first = word1.charAt(0).toUpperCase() + word1.slice(1);
    const second = word2.charAt(0).toUpperCase() + word2.slice(1);
    return first + second;
  },

  createIp() {
    return this.chance.ip();
  },
};
