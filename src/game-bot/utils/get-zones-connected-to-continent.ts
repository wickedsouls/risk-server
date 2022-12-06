import { Game } from '../../game/types';
import { union, values, xor } from 'lodash';

export const getZonesConnectedToContinent = (game: Game, continent: string) => {
  const continentZones = values(game.map.zones).filter((zone) => {
    return zone.continent === continent;
  });
  const continentZonesNames = continentZones.map((zone) => zone.name);
  const neighbours = continentZones.reduce(
    (total, zone) => [...total, ...zone.neighbours],
    [],
  );
  return xor(union(neighbours), continentZonesNames);
};
