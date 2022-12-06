import { Continent } from '../../game/types';
import { values } from 'lodash';

export const getTakenContinentsByEnemy = (
  continents: { [key: string]: Continent<string, string> },
  botId: string,
): Continent<string, string>[] => {
  return values(continents).filter((c) => c.owner && c.owner !== botId);
};
