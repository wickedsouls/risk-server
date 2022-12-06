import { Game } from '../../game/types';
import { getZonesConnectedToContinent } from './get-zones-connected-to-continent';

export const getMyZonesConnectedToContinent = (
  game: Game,
  botId,
  continent: string,
) => {
  return getZonesConnectedToContinent(game, continent).filter((zone) => {
    return game.map.zones[zone].owner === botId;
  });
};
