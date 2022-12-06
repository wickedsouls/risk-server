import { createPaths } from './create-paths';
import { ZonesObject } from '../../game/types';

interface Args {
  from: string;
  to: string;
  depth: number;
  playerId: string;
  zones: ZonesObject;
}
export const getPathToBreakTheContinent = (args: Args) => {
  const { from, depth, to, zones, playerId } = args;
  const paths = createPaths(zones, {
    depth,
    entry: from,
    playerId,
    noContinentFilter: true,
  });
  const correctPaths = paths
    .filter((path) => path.includes(to))
    .sort((a, b) => {
      return a.length > b.length ? 1 : -1;
    });
  return { shortestPath: correctPaths[0], allPaths: correctPaths };
};
