import { Test, TestingModule } from '@nestjs/testing';
import { GameService } from './game.service';
import { GameStatus } from './types';
import { gameStub, playerStub } from '../../test/stubs/game.stub';
import { GameErrors } from '../common/errors';

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

  describe('Create game', () => {
    it('should create public game', async () => {
      const game = await service.createGame(gameStub(), playerStub());
      expect(game).toBeDefined();
      expect(game.gameId).toBeDefined();
      expect(game.gameStatus).toBe(GameStatus.Registering);
      expect(service);
      expect(game.isPrivate).toBeFalsy();
      expect(game.minPlayers).toBe(2);
      expect(game.maxPlayers).toBe(6);
      expect(game.createdBy).toMatchObject(playerStub());
    });
    it('should create private game', async () => {
      const game = await service.createGame(
        gameStub({ isPrivate: true, password: 'secret' }),
        playerStub(),
      );
      expect(game.isPrivate).toBeTruthy();
      expect(game.password).not.toBe('secret');
    });
    it('should throw if game is private without password', async () => {
      await expect(async () => {
        await service.createGame(
          gameStub({ isPrivate: true, password: undefined, minPlayers: 1 }),
          playerStub(),
        );
      }).rejects.toThrow(GameErrors.PASSWORD_IS_REQUIRED);
    });
    it('should throw if player has already created a game', () => {
      // Implement later
    });
  });

  describe('Get games', () => {
    it('should return all games', async () => {
      await service.createGame(gameStub(), playerStub());
      const games = service.getAllGames();
      expect(Object.keys(games).length).toBe(1);
      const gameId = Object.keys(games)[0];
      expect(games[gameId].createdAt).toBeDefined();
    });
  });

  describe('Game preparation', () => {
    it('should join game', async () => {
      const { gameId } = await service.createGame(gameStub(), playerStub());
      service.joinTheGame(gameId, playerStub());
      const game = service.games[gameId];
      expect(game.players.length).toBe(1);
      expect(game.players).toMatchObject([playerStub()]);
    });
    it('should throw error if game is not found', async () => {
      await expect(async () => {
        await service.joinTheGame('123', playerStub());
      }).rejects.toThrow(GameErrors.GAME_NOT_FOUND);
    });
    it('should throw error if game is full', async () => {
      const { gameId } = await service.createGame(
        gameStub({ maxPlayers: 2 }),
        playerStub(),
      );
      await service.joinTheGame(gameId, playerStub());
      await service.joinTheGame(gameId, playerStub({ id: '2', username: '2' }));
      await expect(
        async () =>
          await service.joinTheGame(
            gameId,
            playerStub({ id: '3', username: '3' }),
          ),
      ).rejects.toThrow(GameErrors.GAME_IS_FULL);
    });
    it('should not join if player is already registered', async () => {
      const { gameId, players } = await service.createGame(
        gameStub(),
        playerStub(),
      );
      await service.joinTheGame(gameId, playerStub());
      await service.joinTheGame(gameId, playerStub());
      expect(players.length).toBe(1);
    });
    it('should trow if no or bad password is provided', async () => {
      const { gameId } = await service.createGame(
        gameStub({ isPrivate: true, password: 'secret' }),
        playerStub(),
      );
      await expect(
        async () => await service.joinTheGame(gameId, playerStub(), 'wrong1'),
      ).rejects.toThrow();
    });
    it('should join private game with password', async () => {
      const { gameId } = await service.createGame(
        gameStub({ isPrivate: true, password: 'secret' }),
        playerStub(),
      );
      const game = await service.joinTheGame(gameId, playerStub(), 'secret');
      expect(game).toBeDefined();
    });
    it('should throw error if player joining on started game', async () => {
      // TODO, create this when start game is ready
    });
    it('player should be able to leave the game', async () => {
      const { gameId } = await service.createGame(gameStub(), playerStub());
      service.joinTheGame(gameId, playerStub());
      service.joinTheGame(gameId, playerStub({ id: '2', username: '2' }));
      service.leaveTheGame(gameId, playerStub().id);
      expect(service.games[gameId].players.length).toBe(1);
    });
    it('should delete the game if all players leave', async () => {
      const { gameId } = await service.createGame(gameStub(), playerStub());
      await service.joinTheGame(gameId, playerStub());
      service.leaveTheGame(gameId, playerStub().id);
      expect(service.games[gameId]).toBeUndefined();
    });
    it('should cancel the game', async () => {
      const { gameId } = await service.createGame(gameStub(), playerStub());
      service.cancelGame(gameId, playerStub().id);
      expect(service.games[gameId]).toBeUndefined();
    });
    it('should throw if not creator cancels it', async () => {
      const { gameId } = await service.createGame(gameStub(), playerStub());
      expect(() => {
        service.cancelGame(gameId, 'other');
      }).toThrow(GameErrors.UNAUTHORIZED);
    });
    it('should throw if game is in progress', async () => {
      // TODO: implement that later
    });
    it('should start game', async () => {
      const { gameId } = await service.createGame(
        gameStub({ minPlayers: 1 }),
        playerStub(),
      );
      service.joinTheGame(gameId, playerStub());
      const { gameStatus } = service.startGame(gameId, playerStub().id);
      expect(gameStatus).toBe(GameStatus.InProgress);
    });
    it('should fail to start if not the owner starts it', async () => {
      const { gameId } = await service.createGame(
        gameStub({ minPlayers: 1 }),
        playerStub(),
      );
      service.joinTheGame(gameId, playerStub());
      expect(() => {
        service.startGame(gameId, 'other');
      }).toThrow(GameErrors.UNAUTHORIZED);
    });
    it('should fail to start if game status is not registering', async () => {
      const { gameId } = await service.createGame(
        gameStub({ minPlayers: 1 }),
        playerStub(),
      );
      service.joinTheGame(gameId, playerStub());
      expect(() => {
        service.startGame(gameId, playerStub().id);
        service.startGame(gameId, playerStub().id);
      }).toThrow(GameErrors.BAD_REQUEST);
    });
    it('should fail to start with too few players', async () => {
      const { gameId } = await service.createGame(gameStub(), playerStub());
      expect(() => {
        service.startGame(gameId, playerStub().id);
      }).toThrow(GameErrors.BAD_REQUEST);
    });
  });
});
