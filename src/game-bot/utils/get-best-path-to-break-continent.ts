import { Game } from '../../game/types';
import { getEstimateToBreakSingleContinent } from './get-estimate-to-break-single-continent';
import { getTakenContinentsByEnemy } from './get-taken-continents-by-enemy';

// returns a best calculate path to break continent and minimum army needed to do that
export const getBestPathToBreakContinent = (
  game: Game,
  playerId: string,
  depth: number,
) => {
  const takenContinents = getTakenContinentsByEnemy(
    game.map.continents,
    playerId,
  );
  const [estimatesToBreakContinent] = takenContinents
    .map((continent) => {
      const { bestEstimate } = getEstimateToBreakSingleContinent(
        game,
        continent.name,
        playerId,
        depth,
      );
      return bestEstimate;
    })
    .filter((v) => v)
    .sort((a, b) => (a.army < b.army ? -1 : 1));
  return estimatesToBreakContinent;
};
