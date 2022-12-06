import { Game } from '../../game/types';
import { getMyZones } from './get-my-zones';
import { getAttackPathForContinent } from './get-attack-path-for-continent';
import { sortContinentsForAttack } from './sort-continents-for-attack-priority';
import { getZoneEnemies } from './get-zone-enemies';

export const getBestAttackPathForContinent = (
  game: Game,
  playerId: string,
  depth: number,
): string[] | undefined => {
  const [continent] = sortContinentsForAttack(game.map, playerId);
  let attackingZones;
  if (continent) {
    attackingZones = getMyZones(game.map.zones, playerId).filter((zone) => {
      return zone.continent === continent.continent;
    });
  } else {
    attackingZones = getMyZones(game.map.zones, playerId).filter((zone) => {
      const enemies = getZoneEnemies(zone, game, playerId);
      return enemies.length > 0;
    });
  }
  const paths = attackingZones
    .map((zone) => {
      const { randomPath } = getAttackPathForContinent({
        from: zone.name,
        playerId,
        zones: game.map.zones,
        noContinentFilter: !continent,
        depth,
      });
      return randomPath;
    })
    .sort((a, b) => (a.length > b.length ? -1 : 1));
  return paths[0];
};
