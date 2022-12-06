import { Test, TestingModule } from '@nestjs/testing';
import { GameBotService, Strategy } from './game-bot.service';
import { GameService } from '../game/game.service';
import { ChatService } from '../chat/chat.service';
import { createTestingGame } from '../game/utils';
import { EventLoggerService } from '../event-logger/event-logger.service';
import { getMyZones } from './utils';
import _ from 'lodash';
import { TurnState } from '../game/types';

describe('GameBotService', () => {
  let botService: GameBotService;
  let gameService: GameService;

  const eventLogger = {
    saveGameLogs() {
      null;
    },
  };
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GameBotService,
        GameService,
        ChatService,
        { provide: EventLoggerService, useValue: eventLogger },
      ],
    }).compile();

    botService = module.get<GameBotService>(GameBotService);
    gameService = module.get<GameService>(GameService);
  });

  it('Should be defined', () => {
    expect(botService).toBeDefined();
    expect(gameService).toBeDefined();
  });

  describe('Place armies', () => {
    it('should place armies in Congo', async () => {
      const game = await createTestingGame(gameService, {
        distributeLands: {
          playerId: '1',
          all: true,
        },
        start: true,
      });
      game.map.continents['Africa'].owner = undefined;
      game.map.continents['South America'].owner = undefined;
      game.map.continents['Asia'].owner = undefined;
      game.map.continents['Europe'].owner = undefined;
      game.map.zones['Congo'].owner = '2';
      game.armiesThisTurn = 6;
      game.currentPlayer = { id: '2', isBot: true, username: '2' };
      botService.defineAttackPaths(game, '2');
      botService.placeArmies(game, '2');
      expect(game.map.zones['Congo'].armies).toBe(7);
    });
  });

  describe('Attack', () => {
    it('should find path to break the Europe', async () => {
      const game = await createTestingGame(gameService, {
        distributeLands: {
          playerId: '1',
          all: true,
        },
        start: true,
      });
      game.map.continents['North America'].owner = undefined;
      game.map.continents['South America'].owner = undefined;
      game.map.continents['Africa'].owner = undefined;
      game.map.zones['Eastern US'].owner = '2';
      game.armiesThisTurn = 6;
      botService.defineAttackPaths(game, '2');
      expect(botService.mainAttack.path).toBeDefined();
    });
    it('should not find path to break Australia with low army', async () => {
      const game = await createTestingGame(gameService, {
        distributeLands: {
          playerId: '1',
          all: true,
        },
        start: true,
      });
      game.map.continents['North America'].owner = undefined;
      game.map.continents['South America'].owner = undefined;
      game.map.continents['Africa'].owner = undefined;
      game.map.continents['Asia'].owner = undefined;
      game.map.continents['Europe'].owner = undefined;
      game.map.zones['Afghanistan'].owner = '2';
      game.armiesThisTurn = 5;
      botService.defineAttackPaths(game, '2');
      expect(botService.mainAttack.strategy).toBe(
        Strategy.AttackUnclaimedContinent,
      );
    });
    it('should find path to attack Africa', async () => {
      const game = await createTestingGame(gameService, {
        distributeLands: {
          playerId: '1',
          all: true,
        },
        start: true,
      });
      game.map.continents['Africa'].owner = undefined;
      game.map.continents['South America'].owner = undefined;
      game.map.continents['North America'].owner = undefined;
      game.map.continents['Australia'].owner = undefined;
      game.map.continents['Asia'].owner = undefined;
      game.map.continents['Europe'].owner = undefined;
      game.map.zones['Congo'].owner = '2';
      game.armiesThisTurn = 10;
      botService.defineAttackPaths(game, '2');
      expect(botService.mainAttack.path.length).toBe(6);
    });
    it('should attack Africa from Congo', async () => {
      const game = await createTestingGame(gameService, {
        distributeLands: {
          playerId: '1',
          all: true,
        },
        start: true,
      });
      game.map.continents['Africa'].owner = undefined;
      game.map.continents['South America'].owner = undefined;
      game.map.continents['North America'].owner = undefined;
      game.map.continents['Asia'].owner = undefined;
      game.map.continents['Europe'].owner = undefined;
      game.map.continents['Australia'].owner = undefined;
      game.map.zones['Congo'].owner = '2';
      game.armiesThisTurn = 10;
      game.currentPlayer = { id: '2', isBot: true, username: '2' };
      botService.defineAttackPaths(game, '2');
      botService.placeArmies(game, '2');
      botService.attack(game, '2');
    });
    it('should continue attack from Africa to South America', async () => {
      const game = await createTestingGame(gameService, {
        distributeLands: {
          playerId: '1',
          all: true,
        },
        start: true,
        usePrecision: true,
      });
      game.map.continents['North America'].owner = undefined;
      game.map.continents['Asia'].owner = undefined;
      game.map.continents['Europe'].owner = undefined;
      game.map.continents['Australia'].owner = undefined;

      game.map.continents['Africa'].owner = undefined;
      game.map.zones['Congo'].owner = '2';
      game.armiesThisTurn = 12;
      game.currentPlayer = { id: '2', isBot: true, username: '2' };
      botService.defineAttackPaths(game, '2');
      botService.placeArmies(game, '2');
      botService.attack(game, '2');
      expect(game.map.continents['South America'].owner).not.toBe('2');
      const myZones = getMyZones(game.map.zones, '2');
      expect(myZones.length).toBe(6);
    });
  });
  it('should use other armies for attack', async () => {
    const game = await createTestingGame(gameService, {
      distributeLands: {
        playerId: '1',
        all: true,
      },
      start: true,
      usePrecision: true,
    });

    game.armiesThisTurn = 0;
    game.currentPlayer = { id: '2', username: '2' };
    game.map.continents['North America'].owner = undefined;
    game.map.continents['South America'].owner = undefined;
    game.map.continents['Africa'].owner = undefined;
    game.map.continents['Europe'].owner = undefined;
    game.map.continents['Asia'].owner = undefined;

    game.map.zones['Central America'].owner = '2';
    game.map.zones['Venezuela'].owner = '2';
    game.map.zones['Venezuela'].armies = 7;

    game.map.zones['Madagascar'].owner = '2';
    game.map.zones['South Africa'].owner = '2';
    game.map.zones['Congo'].owner = '2';
    game.map.zones['Congo'].armies = 9;
    botService.attackWithOtherArmies(game, '2');
  });
  it('should move army to enemies', async () => {
    const game = await createTestingGame(gameService, {
      distributeLands: {
        playerId: '1',
        all: true,
      },
      start: true,
      usePrecision: true,
    });

    game.armiesThisTurn = 0;
    game.turnState = TurnState.Move;
    game.currentPlayer = { id: '2', username: '2' };
    game.map.continents['South America'].owner = '2';

    game.map.zones['Brazil'].owner = '2';
    game.map.zones['Peru'].owner = '2';
    game.map.zones['Venezuela'].owner = '2';
    game.map.zones['Argentina'].owner = '2';
    game.map.zones['Peru'].armies = 5;
    game.map.zones['Venezuela'].armies = 4;
    game.map.zones['Argentina'].armies = 4;
    botService.moveArmy(game, '2');
    expect(game.map.zones['Peru'].armies).toBe(1);
    expect(
      game.map.zones['Venezuela'].armies + game.map.zones['Brazil'].armies,
    ).toBe(9);
  });
  it('should move army to enemies', async () => {
    const game = await createTestingGame(gameService, {
      distributeLands: {
        playerId: '1',
        all: true,
      },
      start: true,
      usePrecision: true,
    });

    game.armiesThisTurn = 0;
    game.turnState = TurnState.Move;
    game.currentPlayer = { id: '2', username: '2' };
    game.map.continents['South America'].owner = '2';

    game.map.zones['Brazil'].owner = '2';
    game.map.zones['Peru'].owner = '2';
    game.map.zones['Venezuela'].owner = '2';
    game.map.zones['Argentina'].owner = '2';
    game.map.zones['Peru'].armies = 5;
    game.map.zones['Venezuela'].armies = 4;
    game.map.zones['Argentina'].armies = 4;
    botService.moveArmy(game, '2');
    expect(game.map.zones['Peru'].armies).toBe(1);
    expect(
      game.map.zones['Venezuela'].armies + game.map.zones['Brazil'].armies,
    ).toBe(9);
  });
  it('should move army to entries', async () => {
    const game = await createTestingGame(gameService, {
      distributeLands: {
        playerId: '1',
        all: true,
      },
      start: true,
      usePrecision: true,
    });

    game.armiesThisTurn = 0;
    game.turnState = TurnState.Move;
    game.currentPlayer = { id: '2', username: '2' };
    game.map.continents['South America'].owner = '2';

    game.map.zones['Brazil'].owner = '2';
    game.map.zones['Peru'].owner = '2';
    game.map.zones['Venezuela'].owner = '2';
    game.map.zones['Argentina'].owner = '2';
    game.map.zones['North Africa'].owner = '2';
    game.map.zones['Argentina'].armies = 4;
    botService.moveArmy(game, '2');
    expect(game.map.zones['Argentina'].armies).toBe(1);
    expect(game.map.zones['Brazil'].armies).toBe(4);
  });
  it('should move army randomly', async () => {
    const game = await createTestingGame(gameService, {
      distributeLands: {
        playerId: '1',
        all: true,
      },
      start: true,
      usePrecision: true,
    });

    game.armiesThisTurn = 0;
    game.turnState = TurnState.Move;
    game.currentPlayer = { id: '2', username: '2' };
    game.map.continents['Africa'].owner = undefined;

    game.map.zones['Congo'].owner = '2';
    game.map.zones['North Africa'].owner = '2';
    game.map.zones['Egypt'].owner = '2';
    game.map.zones['East Africa'].owner = '2';
    game.map.zones['South Africa'].owner = '2';
    game.map.zones['Madagascar'].owner = '2';
    game.map.zones['Madagascar'].armies = 4;
    botService.moveArmy(game, '2');
    expect(game.map.zones['Madagascar'].armies).toBe(1);
  });
});
