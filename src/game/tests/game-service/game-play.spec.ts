import { Test, TestingModule } from '@nestjs/testing';
import { GameService } from '../../game.service';
import { ChatService } from '../../../chat/chat.service';
import { createTestingGame } from '../../utils';
import { GameStatus, PlayerStatus } from '../../types';

describe('GameService', () => {
  let gameService: GameService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GameService, ChatService],
    }).compile();

    gameService = module.get<GameService>(GameService);
  });
  it('should end turn', async () => {
    const game = await createTestingGame(gameService, { start: true });
    game.armiesThisTurn = 0;
    gameService.endTurn(game.gameId, game.currentPlayer.id);
    expect(game.currentPlayer.id).toBe(game.players[1].id);
  });
  it('should end turn multiple times', async () => {
    const game = await createTestingGame(gameService, {
      start: true,
      players: 3,
    });
    game.armiesThisTurn = 0;
    gameService.endTurn(game.gameId, game.currentPlayer.id);
    expect(game.currentPlayer.id).toBe(game.players[1].id);

    game.armiesThisTurn = 0;
    gameService.endTurn(game.gameId, game.currentPlayer.id);
    expect(game.currentPlayer.id).toBe(game.players[2].id);

    game.armiesThisTurn = 0;
    gameService.endTurn(game.gameId, game.currentPlayer.id);
    expect(game.currentPlayer.id).toBe(game.players[0].id);
  });
  it('should not pass turn to inactive player', async () => {
    const game = await createTestingGame(gameService, { start: true });
    game.players[1].status = PlayerStatus.Defeat;
    game.players[2].status = PlayerStatus.Surrender;
    game.players[3].status = PlayerStatus.Defeat;

    game.armiesThisTurn = 0;
    gameService.endTurn(game.gameId, game.currentPlayer.id);
    console.log('Players:', game.players);
    expect(game.currentPlayer.id).toBe('5');
  });
  it('should not pass turn if game is not in progress', async () => {
    const game = await createTestingGame(gameService, { start: true });
    game.gameStatus = GameStatus.Completed;
    game.armiesThisTurn = 0;
    expect(() => {
      gameService.endTurn(game.gameId, game.currentPlayer.id);
    }).toThrow();
  });
});
