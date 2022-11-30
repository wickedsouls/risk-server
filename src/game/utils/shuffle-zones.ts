import { Player, Zone } from '../types';
import { shuffle, values } from 'lodash';

export const shuffleZones = (
  _zones: { [key: string]: Zone<string, string> },
  players: Player[],
) => {
  const zones = shuffle(values(_zones));
  const reversedPlayers = players.slice().reverse();

  return zones.map((zone, i) => {
    const modulus = i % players.length;
    return { ...zone, owner: reversedPlayers[modulus].id, armies: 1 };
  });
};
