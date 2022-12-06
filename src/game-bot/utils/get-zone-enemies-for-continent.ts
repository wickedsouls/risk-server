import { Game, Zone } from '../../game/types';
import { getEnemyZones } from './get-enemy-zones';

export const getZoneEnemiesForContinent = (
  zone: Zone<string, string>,
  game: Game,
  botId: string,
  continent: string,
) => {
  return getEnemyZones(game.map.zones, botId)
    .filter((z) => z.continent === continent)
    .map((z) => z.name);
};
