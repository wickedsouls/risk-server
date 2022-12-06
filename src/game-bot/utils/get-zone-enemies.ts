import { Game, Zone } from '../../game/types';
import { getEnemyZones } from './get-enemy-zones';
import { cloneDeep } from 'lodash';

export const getZoneEnemies = (
  zone: Zone<string, string>,
  game: Game,
  botId: string,
) => {
  const enemyZones = getEnemyZones(game.map.zones, botId).map((z) => z.name);
  const zonesWithNeighbours = zone.neighbours.filter((n) => {
    return enemyZones.includes(n);
  });
  return cloneDeep(zonesWithNeighbours);
};
