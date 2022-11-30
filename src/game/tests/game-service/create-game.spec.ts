import { Test, TestingModule } from '@nestjs/testing';
import { GameService } from '../../game.service';
import { ChatService } from '../../../chat/chat.service';
import { GameStatus } from '../../types';
import { gameStub, playerStub } from '../../../../test/stubs/game.stub';
import { GameErrors } from '../../../common/errors';
import { Earth } from '../../maps';

describe('GameService', () => {
  let gameService: GameService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GameService, ChatService],
    }).compile();

    gameService = module.get<GameService>(GameService);
  });

  it('should be defined', () => {
    expect(gameService).toBeDefined();
  });

  describe('Create game', () => {
    it('should create public game', async () => {
      const game = await gameService.createGame(playerStub(), gameStub());
      expect(game).toBeDefined();
      expect(game.gameId).toBeDefined();
      expect(game.gameStatus).toBe(GameStatus.Registering);
      expect(gameService);
      expect(game.isPrivate).toBeFalsy();
      expect(game.minPlayers).toBe(2);
      expect(game.maxPlayers).toBe(6);
      expect(game.createdBy).toMatchObject(playerStub());
    });
    it('should create private game', async () => {
      const game = await gameService.createGame(
        playerStub(),
        gameStub({
          isPrivate: true,
          password: 'secret',
        }),
      );
      expect(game.isPrivate).toBeTruthy();
      expect(game.password).not.toBe('secret');
    });
    it('should throw if game is private without password', async () => {
      await expect(async () => {
        await gameService.createGame(
          playerStub(),
          gameStub({
            isPrivate: true,
            password: undefined,
          }),
        );
      }).rejects.toThrow(GameErrors.PASSWORD_IS_REQUIRED);
    });
    it('should throw if player has already created a game', () => {
      // Implement later
    });
  });
});
