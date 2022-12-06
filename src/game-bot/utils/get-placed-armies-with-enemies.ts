import { Game } from '../../game/types';
import _ from 'lodash';
import { getZoneEnemies } from './get-zone-enemies';

export const getPlacedArmiesWithEnemies = (
  game: Game,
  playerId: string,
  minSize: number,
) => {
  const zones = _.values(game.map.zones);
  return zones.filter((zone) => {
    const zoneEnemies = getZoneEnemies(zone, game, playerId);
    return zoneEnemies.length > 0 && zone.armies >= minSize;
  });
};
