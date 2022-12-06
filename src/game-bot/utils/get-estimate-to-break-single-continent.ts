import { Game } from '../../game/types';
import { getMinArmyEstimateAgainstPaths } from './get-min-army-estimate-against-paths';
import { getPathToBreakTheContinent } from './get-path-to-break-the-continent';
import { getMyZones } from './get-my-zones';
import _ from 'lodash';

// Gets path and army needed to break single continent
// Checks every myZones and enemy entry point pairs
export const getEstimateToBreakSingleContinent = (
  game: Game,
  continent: string,
  playerId: string,
  depth: number,
): {
  bestEstimate: { army: number; path: string[] } | undefined;
  all: { army: number; path: string[] }[];
} => {
  const myZones = getMyZones(game.map.zones, playerId);
  // Map every entry point
  const estimates = game.map.continents[continent].entryPoints.map((entry) => {
    // Map every zone owned by player
    const estimatedArmies = myZones.map((zone) => {
      const { allPaths } = getPathToBreakTheContinent({
        from: zone.name,
        to: entry,
        depth,
        playerId,
        zones: game.map.zones,
      });
      return getMinArmyEstimateAgainstPaths(allPaths, game.map.zones);
    });
    return estimatedArmies;
  });
  const allEstimates = _.flatten(estimates)
    .filter((v) => v)
    .sort((a, b) => (a.army > b.army ? 1 : -1));

  return { bestEstimate: allEstimates[0], all: allEstimates };
};
