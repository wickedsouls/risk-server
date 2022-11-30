import { Test, TestingModule } from '@nestjs/testing';
import { GameBotService } from './game-bot.service';
import { GameService } from '../game/game.service';
import { ChatService } from '../chat/chat.service';
import { createTestingGame } from '../game/utils';
import { playerStub } from '../../test/stubs/game.stub';
import { Server } from 'socket.io';
import { values } from 'lodash';

describe('GameBotService', () => {
  let botService: GameBotService;
  let gameService: GameService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GameBotService, GameService, ChatService],
    }).compile();

    botService = module.get<GameBotService>(GameBotService);
    gameService = module.get<GameService>(GameService);
  });

  it('Should be defined', () => {
    expect(botService).toBeDefined();
    expect(gameService).toBeDefined();
  });

  describe('Game bot helpers', () => {
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
      const enemies = botService.getNeighbourEnemies(
        zone,
        game,
        playerStub().id,
      );
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
      await botService.placeArmies(game);
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
      console.log(myZones);
      expect(myZones.length).toBe(4);
    });
  });
});
