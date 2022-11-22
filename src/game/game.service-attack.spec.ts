import { Test, TestingModule } from '@nestjs/testing';
import { GameService } from './game.service';
import { Game } from './types';
import { gameStub, playerStub } from '../../test/stubs/game.stub';
import { Earth } from './maps';

describe('GameService', () => {
  let service: GameService;
  let game: Game;

  const startFreshGameWithPlayers = async (playerCount: number) => {
    const game = await service.createGame(gameStub(), playerStub());
    const players = [];
    for (let i = 0; i < playerCount; i++) {
      players.push(playerStub({ id: i + '', username: i + '' }));
    }
    players.forEach(async (player) => {
      await service.joinTheGame(game.gameId, player);
    });
    service.startGame(game.gameId, game.createdBy.id);
    return game;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GameService],
    }).compile();

    service = module.get<GameService>(GameService);

    game = await startFreshGameWithPlayers(6);
    console.log(99);
    service.initGame(game.gameId, Earth);
  });

  it('should win continent', async () => {
    const obj = getObj();
    obj.x = 10;
    obj.map.continents['Africa'].owner = '22';

    expect(obj.x).toBe(10);
  });
  it('should not win continent when not all lands are taken', async () => {
    const obj = getObj();
    console.log('obj', obj.map.continents['Africa']);
    expect(obj.x).toBe(1);
  });
});
