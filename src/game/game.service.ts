import { Injectable } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { faker } from '../utils/faker';
import { CreateGameData, Game, GameStatus } from './interface';
import { passwordEncryption } from '../utils/password-encription';
import { WsErrors } from '../constants/errors';

@Injectable()
export class GameService {
  games: { [key: string]: Game } = {};

  startGame(name: string) {
    this.games[name].gameStatus = GameStatus.InProgress;
  }

  leaveTheGame(userId: string, name: string) {
    const players = this.games[name].players.filter((user) => user !== userId);
    this.games[name].players = players;
  }

  joinTheGame(userId: string, name: string) {
    const game = this.games[name];
    if (!game) {
      throw new WsException(WsErrors.GAME_NOT_FOUND);
    }
    if (game.gameStatus !== GameStatus.Registering) {
      throw new WsException(WsErrors.REGISTRATION_HAS_ENDED);
    }
    if (game.maxPlayers === game.players.length) {
      throw new WsException(WsErrors.GAME_IS_FULL);
    }
    if (game.players.includes(userId)) {
      throw new WsException(WsErrors.ALREADY_REGISTERED);
    }
    return game.players.push(userId);
  }

  getJoinedPlayers(name: string) {
    return this.games[name].players;
  }

  async createGame(data: CreateGameData): Promise<Game> {
    const { isPrivate, password } = data;
    const gameId = faker.createName();
    const game: Game = {
      players: [],
      isPrivate,
      currentPlayer: '',
      gameId,
      maxPlayers: 6,
      minPlayers: 2,
      gameStatus: GameStatus.Registering,
    };
    if (isPrivate) {
      game.password = await passwordEncryption.hashPassword(password);
    }
    this.games[gameId] = game;
    return game;
  }

  getAllGames() {
    return this.games;
  }

  getGameByName(name: string): Game | undefined {
    return this.games[name];
  }
}
