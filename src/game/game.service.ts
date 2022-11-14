import { Injectable } from '@nestjs/common';
import { faker } from '../utils/faker';
import { Game, GameStatus, Player } from './types';
import { GameErrors } from '../common/errors';
import { CreateGameDto } from '../gateways/dtos/create-game.dto';
import { passwordEncryption } from '../utils/password-encription';

@Injectable()
export class GameService {
  games: { [key: string]: Game } = {};

  static gameError(message: GameErrors) {
    return { error: true, message };
  }

  private getGameById(gameId: string): Game {
    if (!gameId || !this.games[gameId]) {
      throw new Error(GameErrors.GAME_NOT_FOUND);
    } else {
      return this.games[gameId];
    }
  }

  startGame(gameId: string, playerId: string) {
    const game = this.getGameById(gameId);
    if (game.players.length < game.minPlayers) {
      throw new Error(GameErrors.BAD_REQUEST);
    }
    if (game.gameStatus !== GameStatus.Registering) {
      throw new Error(GameErrors.BAD_REQUEST);
    }
    if (game.createdBy.id !== playerId) {
      throw new Error(GameErrors.UNAUTHORIZED);
    }
    game.gameStatus = GameStatus.InProgress;
    return game;
  }

  leaveTheGame(gameId: string, playerId: string) {
    const game = this.getGameById(gameId);
    this.games[gameId].players = game.players.filter(
      (player) => player.id !== playerId,
    );
    if (game.players.length === 0) {
      delete this.games[gameId];
    }
    return game;
  }

  async joinTheGame(gameId: string, player: Player, password?: string) {
    const game = this.getGameById(gameId);
    if (game.isPrivate) {
      const match = await passwordEncryption.verifyPassword(
        password,
        game.password,
      );
      if (!match) throw new Error(GameErrors.INVALID_PASSWORD);
    }
    if (game.gameStatus === GameStatus.Completed) {
      throw new Error(GameErrors.GAME_HAS_ENDED);
    }
    if (game.maxPlayers === game.players.length) {
      throw new Error(GameErrors.GAME_IS_FULL);
    }
    if (!game.players.find((p) => p.id === player.id)) {
      game.players.push(player);
    }
    return game;
  }

  async createGame(data: CreateGameDto, player: Player) {
    const { isPrivate, password, maxPlayers, minPlayers } = data;
    if (isPrivate && !password) {
      throw new Error(GameErrors.PASSWORD_IS_REQUIRED);
    }
    let hash: string;
    if (isPrivate) {
      hash = await passwordEncryption.hashPassword(password);
    }
    const gameId = faker.createName();
    const game: Game = {
      players: [],
      isPrivate,
      currentPlayer: '',
      gameId,
      password: hash || password,
      maxPlayers,
      minPlayers,
      createdBy: player,
      gameStatus: GameStatus.Registering,
      createdAt: new Date(),
    };
    this.games[gameId] = game;
    return game;
  }

  cancelGame(gameId: string, userId: string) {
    const { createdBy } = this.getGameById(gameId);
    if (createdBy.id !== userId) {
      throw new Error(GameErrors.UNAUTHORIZED);
    }
    this.games[gameId] = undefined;
    // if(game)
  }

  getAllGames() {
    return this.games;
  }
}
