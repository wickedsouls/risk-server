import { ZonesObject } from '../../game/types';

// Returns the best path to use the least armies
export const getMinArmyEstimateAgainstPaths = (
  paths: string[][],
  zones: ZonesObject,
): { army: number; path: string[] } | undefined => {
  const estimates = [];
  paths.forEach((path) => {
    let army = 0;
    path.forEach((zone, i) => {
      if (i === 0) return;
      army += zones[zone].armies + 1;
    });
    estimates.push({ army, path });
  });

  return estimates.sort((a, b) => (a.army > b.army ? 1 : -1))[0];
};
