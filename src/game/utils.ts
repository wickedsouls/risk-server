import { Game, GameStatus, Player } from './types';
import dotenv from 'dotenv';
import { Earth } from './maps';

dotenv.config();

interface Options {
  players: Player[];
  currentPlayer: Player;
  gameStatus: GameStatus;
}
export const createTestingGame = (options: Options): any => {
  const { players, currentPlayer, gameStatus } = options;
  return {
    players,
    gameId: 'sandbox',
    currentPlayer,
    minPlayers: 2,
    map: Earth,
    gameStatus,
    maxPlayers: 6,
    createdBy: currentPlayer,
    createdAt: new Date(),
  };
};
