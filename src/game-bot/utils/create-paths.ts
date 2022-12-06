import { ZonesObject } from '../../game/types';
import _ from 'lodash';

interface Options {
  depth: number;
  entry: string;
  playerId: string;
  noContinentFilter?: boolean;
}

export const createPaths = (nodes: ZonesObject, options: Options) => {
  const { noContinentFilter, entry } = options;

  function filterNodes() {
    if (noContinentFilter) return nodes;
    const continent = nodes[entry].continent;
    const nodesArray = _.values(nodes).filter(
      (node) => node.continent === continent,
    );
    return _.keyBy(nodesArray, 'name');
  }

  const continentNodes = filterNodes();

  function getPaths(
    nodes: ZonesObject,
    options: Options,
    prevNode?: string,
    path: string[] = [],
    allPaths: string[][] = [],
  ) {
    const { depth, entry, playerId } = options;
    const node = nodes[entry];
    if (!node) return;
    const visitedPath = [...path]; // do the deep clone here
    visitedPath.push(node.name);
    let index = 0;

    const notVisited = node.neighbours
      .filter((n) => !visitedPath.includes(n))
      .filter((n) => {
        return continentNodes[n] && continentNodes[n].owner !== playerId;
      });

    while (notVisited[index] && depth !== 0) {
      getPaths(
        nodes,
        { depth: depth - 1, entry: notVisited[index], playerId },
        node.name,
        visitedPath,
        allPaths,
      );
      index++;
    }
    if (!notVisited[index] || depth === 0) {
      allPaths.push(visitedPath);
      return allPaths;
    }
  }

  return getPaths(continentNodes, options);
};
