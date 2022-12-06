import { playerStub } from '../../../test/stubs/game.stub';
import { cloneDeep, values } from 'lodash';
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
    usePrecision = true,
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
  if (distributeLands?.all && distributeLands?.playerId) {
    const { playerId } = distributeLands;
    for (const zone in game.map.zones) {
      game.map.zones[zone].owner = playerId;
      game.map.zones[zone].armies = 1;
    }
    for (const continent in game.map.continents) {
      game.map.continents[continent].owner = playerId;
    }
  }
  if (distributeLands?.continents && distributeLands?.playerId) {
    const { continents, playerId } = distributeLands;
    continents.forEach((continent) => {
      game.map.continents[continent].owner = playerId;
      const zones = values(game.map.zones).filter(
        (zone) => zone.continent === continent,
      );
      zones.forEach((zone) => {
        game.map.zones[zone.name].owner = playerId;
        game.map.zones[zone.name].armies = 1;
      });
    });
  }
  return game;
};
