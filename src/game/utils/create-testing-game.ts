import { playerStub } from '../../../test/stubs/game.stub';
import { cloneDeep } from 'lodash';
import { GameService } from '../game.service';
import { Earth } from '../maps';

interface Options {
  players: number;
  usePrecision: boolean;
  minPlayers: number;
  maxPlayers: number;
  createdById: string;
  createdByName: string;
  start: boolean;
  joinGame: boolean;
  isPrivate: boolean;
  password: string;
  shufflePlayers: boolean;
  shuffleColors: boolean;
  distributeLands?: {
    playerId: string;
    zones?: string[];
    continents?: string[];
    all?: boolean;
  };
}
export const createTestingGame = async (
  gameService: GameService,
  options: Partial<Options> = {},
) => {
  const {
    minPlayers = 2,
    maxPlayers = 6,
    players = 6,
    usePrecision,
    createdById = '1',
    createdByName = 'user-1',
    start,
    joinGame = true,
    isPrivate,
    password,
    distributeLands,
    shuffleColors = false,
    shufflePlayers = false,
  } = options;
  const player = { id: createdById, username: createdByName };
  const game = await gameService.createGame(player, {
    minPlayers,
    maxPlayers,
    map: Earth,
    isPrivate,
    password,
  });
  if (joinGame) {
    await gameService.joinTheGame(game.gameId, player, password);
  }

  for (let i = 2; i <= players; i++) {
    const newPlayer = cloneDeep(
      playerStub({ id: i + '', username: `user-${i}` }),
    );
    await gameService.joinTheGame(game.gameId, newPlayer);
  }
  if (start) {
    gameService.startGame(game.gameId, player.id, {
      usePrecision,
      shufflePlayers: false,
      shuffleColors: false,
    });
  }
  if (distributeLands?.all) {
    const { playerId } = distributeLands;
    for (const zone in game.map.zones) {
      game.map.zones[zone].owner = playerId;
    }
    for (const continent in game.map.continents) {
      game.map.continents[continent].owner = playerId;
    }
  }
  return game;
};
