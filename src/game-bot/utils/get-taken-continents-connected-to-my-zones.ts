import { Continent, Game } from '../../game/types';
import { getMyZonesConnectedToContinent } from './get-my-zones-connected-to-continent';

export const getTakenContinentsConnectedToMyZones = (
  game: Game,
  botId: string,
  _continents: Continent<string, string>[],
) => {
  const continents = _continents.filter((c) => {
    const zones = getMyZonesConnectedToContinent(game, botId, c.name);
    return zones.length > 0;
  });
  return continents;
};
