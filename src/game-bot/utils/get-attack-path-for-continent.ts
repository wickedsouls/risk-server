import { ZonesObject } from '../../game/types';
import { createPaths } from './create-paths';
import { rng } from '../../utils/rng';

export const getAttackPathForContinent = (data: {
  from: string;
  playerId: string;
  zones: ZonesObject;
  noContinentFilter?: boolean;
  depth: number;
}) => {
  const { from, playerId, zones, noContinentFilter } = data;
  const depth = data.depth < 10 ? data.depth : 10;
  const paths = createPaths(zones, {
    depth,
    entry: from,
    playerId,
    noContinentFilter,
  });
  let longestPath = 0;
  paths.forEach((path) => {
    if (path.length > longestPath) longestPath = path.length;
  });
  const longestPaths = paths.filter((path) => path.length === longestPath);
  const randomPath = rng.getRandomArrayItem(longestPaths);
  return { longestPaths, randomPath };
};
