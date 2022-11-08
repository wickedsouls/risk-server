import { Test, TestingModule } from '@nestjs/testing';
import { GameService } from './game.service';
import { GameStatus } from './interface';
import { WsErrors } from '../constants/errors';

describe('GameService', () => {
  let service: GameService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GameService],
    }).compile();

    service = module.get<GameService>(GameService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create game', () => {
    it('should create public game', async () => {
      const game = await service.createGame({});
      expect(service.games[game.gameId]).toBeDefined();
      expect(service.games[game.gameId].gameId).toBe(game.gameId);
      expect(service.games[game.gameId].gameStatus).toBe(
        GameStatus.Registering,
      );
    });
    it('should create private game', async () => {
      const game = await service.createGame({
        password: 'secret',
        isPrivate: true,
      });
      expect(service.games[game.gameId]).toBeDefined();
      expect(service.games[game.gameId].password).not.toBe('secret');
      expect(service.games[game.gameId].isPrivate).toBe(true);
    });
  });

  describe('get games', () => {
    it('should return all games', async () => {
      await service.createGame({});
      await service.createGame({});
      const games = service.getAllGames();
      expect(Object.keys(games).length).toBe(2);
    });
    it('should get game by its name', async () => {
      const createdGame = await service.createGame({});
      const game = service.getGameByName(createdGame.gameId);
      expect(game).toBeDefined();
      expect(game.gameId).toBe(createdGame.gameId);
    });
    it('should return undefined if game is not found', async () => {
      await service.createGame({});
      expect(service.getGameByName('bad name')).toBe(undefined);
    });
  });

  describe('game preparation', () => {
    it('should start the game', async () => {
      const game = await service.createGame({});
      service.startGame(game.gameId);
      expect(game.gameStatus).toBe(GameStatus.InProgress);
    });
    it('should join game', async () => {
      const userId = '123';
      const { gameId } = await service.createGame({});
      service.joinTheGame(userId, gameId);
      const game = service.games[gameId];
      expect(game.players.length).toBe(1);
      expect(game.players).toContain(userId);
    });
    it('should throw error if game is full', async () => {
      const { gameId } = await service.createGame({});
      service.joinTheGame('01', gameId);
      service.joinTheGame('02', gameId);
      service.joinTheGame('03', gameId);
      service.joinTheGame('04', gameId);
      service.joinTheGame('05', gameId);
      service.joinTheGame('06', gameId);
      expect(() => service.joinTheGame('07', gameId)).toThrow(
        WsErrors.GAME_IS_FULL,
      );
    });
    it('should throw error if player is already joined', async () => {
      const { gameId } = await service.createGame({});
      service.joinTheGame('01', gameId);
      expect(() => service.joinTheGame('01', gameId)).toThrow(
        WsErrors.ALREADY_REGISTERED,
      );
    });
    // it('should throw error if player is already in other game', async () => {
    //   const game1 = await service.createGame({});
    //   const game2 = await service.createGame({});
    //   service.joinTheGame('01', game1.gameId);
    //   expect(() => service.joinTheGame('01', game2.gameId)).toThrow(
    //     WsErrors.GAME_IS_FULL,
    //   );
    // });
    it('should throw error if player joining on started game', async () => {
      const { gameId } = await service.createGame({});
      service.startGame(gameId);
      expect(() => service.joinTheGame('01', gameId)).toThrow(
        WsErrors.REGISTRATION_HAS_ENDED,
      );
    });
    it('should return all joined players of the game', async () => {
      const { gameId } = await service.createGame({});
      const userId1 = '01';
      const userId2 = '02';
      service.joinTheGame(userId1, gameId);
      service.joinTheGame(userId2, gameId);
      const players = service.getJoinedPlayers(gameId);
      expect(players.length).toBe(2);
      expect(players).toContain(userId1);
      expect(players).toContain(userId2);
    });
    it('player should be able to leave the game', async () => {
      const { gameId } = await service.createGame({});
      const userId1 = '01';
      service.joinTheGame(userId1, gameId);
      service.leaveTheGame(userId1, gameId);
      const game = service.getGameByName(gameId);
      expect(game.players.length).toBe(0);
    });
  });
});
