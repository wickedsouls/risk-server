import { Test, TestingModule } from '@nestjs/testing';
import { GameService } from '../../game.service';
import { ChatService } from '../../../chat/chat.service';
import { GameStatus } from '../../types';
import { playerStub } from '../../../../test/stubs/game.stub';
import { GameErrors } from '../../../common/errors';
import { createTestingGame } from '../../utils';

describe('GameService', () => {
  let gameService: GameService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GameService, ChatService],
    }).compile();

    gameService = module.get<GameService>(GameService);
  });

  describe('Get games', () => {
    it('should return all games', async () => {
      await createTestingGame(gameService);
      const games = gameService.getAllGames();
      expect(Object.keys(games).length).toBe(1);
      const gameId = Object.keys(games)[0];
      expect(games[gameId].createdAt).toBeDefined();
    });
  });

  describe('Get game info', () => {
    it('should return game info', async () => {
      const { gameId } = await createTestingGame(gameService);
      const game = gameService.getGameInfo(gameId, '1');
      expect(game.createdAt).toBeDefined();
      expect(game.createdAt).toBeDefined();
    });
    it('should get started private game info', async () => {
      const { gameId } = await createTestingGame(gameService, {
        isPrivate: true,
        password: 'secret',
        players: 1,
      });
      await gameService.joinTheGame(gameId, playerStub({ id: '2' }), 'secret');
      await gameService.startGame(gameId, playerStub().id);
      const game = await gameService.getGameInfo(gameId, playerStub().id);
      expect(game).toBeDefined();
    });
    it('should throw on private game on unknown player', async () => {
      const { gameId } = await createTestingGame(gameService, {
        isPrivate: true,
        password: 'secret',
        players: 1,
      });
      await gameService.joinTheGame(gameId, playerStub({ id: '2' }), 'secret');
      await gameService.startGame(gameId, playerStub().id);
      expect(() => {
        gameService.getGameInfo(gameId, 'otherId');
      }).toThrow(GameErrors.UNAUTHORIZED);
    });
  });

  describe('Game preparation', () => {
    it('should join game', async () => {
      const game = await createTestingGame(gameService, {
        players: 0,
        joinGame: false,
      });
      await gameService.joinTheGame(game.gameId, playerStub());
      expect(game.players.length).toBe(1);
      expect(game.players).toMatchObject([playerStub()]);
    });
    it('should throw error if game is not found', async () => {
      await createTestingGame(gameService);
      await expect(async () => {
        await gameService.joinTheGame('123', playerStub());
      }).rejects.toThrow(GameErrors.GAME_NOT_FOUND);
    });
    it('should throw error if game is full', async () => {
      const { gameId } = await createTestingGame(gameService, { players: 6 });
      await expect(
        async () =>
          await gameService.joinTheGame(
            gameId,
            playerStub({ id: '7', username: 'user-7' }),
          ),
      ).rejects.toThrow(GameErrors.GAME_IS_FULL);
    });
    it('should not join if player is already registered', async () => {
      const game = await createTestingGame(gameService, { players: 2 });
      await gameService.joinTheGame(game.gameId, playerStub());
      expect(game.players.length).toBe(2);
    });
    it('should trow if no or bad password is provided', async () => {
      const game = await createTestingGame(gameService, {
        password: 'secret',
        isPrivate: true,
        joinGame: false,
        players: 0,
      });
      await expect(async () => {
        await gameService.joinTheGame(game.gameId, playerStub(), 'wrong1');
      }).rejects.toThrow();
    });
    it('should join private game with password', async () => {
      const { gameId } = await createTestingGame(gameService, {
        password: 'secret',
        isPrivate: true,
        joinGame: false,
        players: 0,
      });
      const game = await gameService.joinTheGame(
        gameId,
        playerStub(),
        'secret',
      );
      expect(game).toBeDefined();
    });
    it('should throw error if player joining on started game', async () => {
      const game = await createTestingGame(gameService, { start: true });
      await expect(async () => {
        await gameService.joinTheGame(game.gameId, playerStub());
      }).rejects.toThrow();
    });
    it('player should be able to leave the game', async () => {
      const { gameId } = await createTestingGame(gameService, { players: 1 });
      await gameService.joinTheGame(
        gameId,
        playerStub({ id: '2', username: '2' }),
      );
      expect(gameService.games[gameId].players.length).toBe(2);
      gameService.leaveTheGame(gameId, playerStub().id);
      expect(gameService.games[gameId].players.length).toBe(1);
    });
    it('should delete the game if all players leave', async () => {
      const { gameId } = await createTestingGame(gameService, { players: 1 });
      gameService.leaveTheGame(gameId, playerStub().id);
      expect(gameService.games[gameId]).toBeUndefined();
    });
    it('should cancel the game', async () => {
      const { gameId } = await createTestingGame(gameService);
      gameService.cancelGame(gameId, playerStub().id);
      expect(gameService.games[gameId]).toBeUndefined();
    });
    it('should throw if not creator cancels it', async () => {
      const { gameId } = await createTestingGame(gameService);
      expect(() => {
        gameService.cancelGame(gameId, 'other');
      }).toThrow(GameErrors.UNAUTHORIZED);
    });
    it('should throw if game is in progress', async () => {
      const { gameId } = await createTestingGame(gameService, { start: true });
      expect(() => {
        gameService.cancelGame(gameId, playerStub().id);
      }).toThrow(GameErrors.GAME_HAS_STARTED);
    });
    it('should start game', async () => {
      const { gameId } = await createTestingGame(gameService, { start: false });
      const { gameStatus } = gameService.startGame(gameId, playerStub().id);
      expect(gameStatus).toBe(GameStatus.InProgress);
    });
    it('should fail to start if not the owner starts it', async () => {
      const { gameId } = await createTestingGame(gameService, { start: false });
      expect(() => {
        gameService.startGame(gameId, 'other');
      }).toThrow(GameErrors.UNAUTHORIZED);
    });
    it('should fail to start with too few players', async () => {
      const { gameId } = await createTestingGame(gameService, {
        start: false,
        minPlayers: 3,
        players: 2,
      });
      expect(() => {
        gameService.startGame(gameId, playerStub().id);
      }).toThrow(GameErrors.NOT_ENOUGH_PLAYERS);
    });
  });
});
