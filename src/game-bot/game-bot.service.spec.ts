import { Test, TestingModule } from '@nestjs/testing';
import { GameBotService } from './game-bot.service';
import { GameService } from '../game/game.service';
import { ChatService } from '../chat/chat.service';
import { createTestingGame } from '../game/utils';
import { playerStub } from '../../test/stubs/game.stub';
import { EventLoggerService } from '../event-logger/event-logger.service';
import { values } from 'lodash';

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

  describe('Game bot helpers', () => {
    it('should get all zones connected to continent', async () => {
      const game = await createTestingGame(gameService);
      const continents = [
        'Asia',
        'Europe',
        'North America',
        'South America',
        'Africa',
        'Australia',
      ];
      const zones = continents.map((continent) => {
        return botService.getZonesConnectedToContinent(game, continent);
      });
      expect(zones[0].length).toBe(6);
      expect(zones[1].length).toBe(6);
      expect(zones[2].length).toBe(3);
      expect(zones[3].length).toBe(2);
      expect(zones[4].length).toBe(4);
      expect(zones[5].length).toBe(1);
    });
    it('should get my zones connected to continent', async () => {
      const bot = playerStub({ id: '1' });
      const player = playerStub({ id: '2' });
      const game = await createTestingGame(gameService, {
        distributeLands: { playerId: player.id, all: true },
      });
      game.map.zones['Brazil'].owner = bot.id;
      game.map.zones['Middle East'].owner = bot.id;
      const connectedZones = botService.getMyZonesConnectedToContinent(
        game,
        bot.id,
        'Africa',
      );
      expect(connectedZones.length).toBe(2);
    });
    it('should find taken continents', async () => {
      const bot = playerStub({ id: '1' });
      const player = playerStub({ id: '2' });
      const game = await createTestingGame(gameService, {
        distributeLands: { playerId: player.id, continents: ['Africa'] },
      });
      const takenContinents = botService.getTakenContinents(game, bot.id);
      expect(takenContinents.length).toBe(1);
    });
    it('should get enemy zones', async () => {
      const game = await createTestingGame(gameService, {
        distributeLands: { playerId: playerStub().id, all: true },
      });
      game.map.zones['Argentina'].owner = '2';
      game.map.zones['Peru'].owner = '2';
      game.map.zones['Brazil'].owner = '2';
      const zones = botService.getEnemyZones(game, playerStub().id);
      expect(zones.length).toBe(3);
    });
    it('should get my zones', async () => {
      const game = await createTestingGame(gameService, {
        distributeLands: { playerId: playerStub().id, all: true },
      });
      game.map.zones['Argentina'].owner = '2';
      game.map.zones['Peru'].owner = '2';
      game.map.zones['Brazil'].owner = '2';
      const zones = botService.getMyZones(game, playerStub().id);
      expect(zones.length).toBe(39);
    });
    it('should find neighbour enemies', async () => {
      const game = await createTestingGame(gameService, {
        distributeLands: { playerId: playerStub().id, all: true },
      });
      game.map.zones['Peru'].owner = '2';
      game.map.zones['Brazil'].owner = '2';
      const zone = game.map.zones['Argentina'];
      const enemies = botService.getZoneEnemies(zone, game, playerStub().id);
      expect(enemies.length).toBe(2);
      expect(enemies).toContain('Peru');
      expect(enemies).toContain('Brazil');
    });
    it('should get zones with enemies case 1', async () => {
      const game = await createTestingGame(gameService, {
        distributeLands: { playerId: playerStub().id, all: true },
      });
      game.map.zones['Brazil'].owner = '2';
      const zonesWithEnemies = botService.getZonesWithEnemies(
        game,
        playerStub().id,
      );
      expect(zonesWithEnemies.length).toBe(4);
    });
    it('should get zones with enemies case 2', async () => {
      const game = await createTestingGame(gameService, {
        distributeLands: { playerId: playerStub().id, all: true },
      });
      game.map.zones['Japan'].owner = '2';
      const zonesWithEnemies = botService.getZonesWithEnemies(
        game,
        playerStub().id,
      );
      expect(zonesWithEnemies.length).toBe(2);
    });
  });

  describe('Place armies', () => {
    it('should place armies', async () => {
      const game = await createTestingGame(gameService, {
        distributeLands: { playerId: '2', all: true },
        start: true,
      });
      game.map.zones['Peru'].owner = playerStub().id;
      botService.placeArmies(game, playerStub().id);
    });
    it('should place armies strategy = AttackOccupiedContinent', async () => {
      const player = playerStub({ id: 'player' });
      const bot = playerStub({ id: 'bot' });
      const game = await createTestingGame(gameService, {
        distributeLands: { playerId: bot.id, all: true },
        start: true,
      });
      game.players[0] = player;
      game.players[1] = bot;
      game.currentPlayer = bot;
      game.armiesThisTurn = 10;
      game.map.continents['Australia'].owner = player.id;
      game.map.zones['Indonesia'].owner = player.id;
      game.map.zones['New Guinea'].owner = player.id;
      game.map.zones['Eastern Australia'].owner = player.id;
      game.map.zones['Western Australia'].owner = player.id;
      botService.placeArmies_AttackOccupiedContinent(game, bot.id);
      expect(game.map.zones['Siam'].armies).toBe(11);
    });
    it('should place armies strategy = placeArmies_AttackManyZones', async () => {
      const player = playerStub({ id: 'player' });
      const bot = playerStub({ id: 'bot' });
      const game = await createTestingGame(gameService, {
        distributeLands: { playerId: player.id, all: true },
        start: true,
      });
      game.players[0] = player;
      game.players[1] = bot;
      game.currentPlayer = bot;
      game.armiesThisTurn = 10;
      game.map.zones['Siam'].owner = bot.id;
      botService.placeArmies_AttackManyZones(game, bot.id);
      expect(game.map.zones['Siam'].armies).toBe(11);
    });
  });
  describe('Attack', () => {
    it('should attack one zones', async () => {
      const game = await createTestingGame(gameService, {
        distributeLands: { playerId: '1', all: true },
        start: true,
        usePrecision: true,
      });
      game.map.zones['Argentina'].owner = '2';
      game.map.zones['Peru'].armies = 5;
      game.armiesThisTurn = 0;
      botService.attack(game);
      expect(game.map.zones['Argentina'].owner).toBe('1');
      expect(game.map.zones['Argentina'].armies).toBe(3);
    });
    it('should attack two zones', async () => {
      const game = await createTestingGame(gameService, {
        distributeLands: { playerId: '1', all: true },
        start: true,
        usePrecision: true,
      });
      game.map.zones['Argentina'].owner = '2';
      game.map.zones['Brazil'].owner = '2';
      game.map.zones['Peru'].armies = 10;
      game.armiesThisTurn = 0;
      botService.attack(game);
      expect(game.map.zones['Argentina'].owner).toBe('1');
      expect(game.map.zones['Brazil'].owner).toBe('1');
    });
    it('should attack three zones', async () => {
      const botId = '1';
      const game = await createTestingGame(gameService, {
        distributeLands: { playerId: '2', all: true },
        start: true,
        usePrecision: true,
      });
      game.map.zones['Ural'].owner = botId;
      game.map.zones['Ural'].armies = 7;
      game.armiesThisTurn = 0;
      botService.attack(game);
      const myZones = botService.getMyZones(game, botId);
      expect(myZones.length).toBe(4);
    });
  });
});
