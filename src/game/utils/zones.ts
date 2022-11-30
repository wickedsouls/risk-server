import { Game } from '../types';
import { values } from 'lodash';

export const getPlayerZones = (playerId: string, game: Game) => {
  return values(game.map.zones).filter((zone) => {
    return zone.owner === game.currentPlayer.id;
  });
};
export const getOtherPlayerZones = (playerId: string, game: Game) => {
  return values(game.map.zones).filter((zone) => {
    return zone.owner !== game.currentPlayer.id;
  });
};
