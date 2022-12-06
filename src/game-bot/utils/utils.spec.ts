import _ from 'lodash';
import { sortContinentsForAttack } from './sort-continents-for-attack-priority';
import { Earth } from '../../game/maps';
import { createTestingGame } from '../../game/utils';
import { playerStub } from '../../../test/stubs/game.stub';
import { GameBotService } from '../game-bot.service';
import { GameService } from '../../game/game.service';
import { Test, TestingModule } from '@nestjs/testing';
import { ChatService } from '../../chat/chat.service';
import { EventLoggerService } from '../../event-logger/event-logger.service';
import {
  getMyZones,
  getTakenContinentsByEnemy,
  getEnemyZones,
  getZoneEnemies,
  getZonesConnectedToContinent,
} from './';
import { createPaths } from './create-paths';
import { getAttackPathForContinent } from './get-attack-path-for-continent';
import { getPathToBreakTheContinent } from './get-path-to-break-the-continent';
import { getMinArmyEstimateAgainstPaths } from './get-min-army-estimate-against-paths';
import { getEstimateToBreakSingleContinent } from './get-estimate-to-break-single-continent';
import { getPlacedArmiesWithEnemies } from './get-placed-armies-with-enemies';
import { getBestAttackPathForContinent } from './get-best-attack-path-for-continent';

describe('Bot service utils', () => {
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

  it('should return sorted continents for attack', async () => {
    const map = _.cloneDeep(Earth);
    // South America
    map.zones['Brazil'].owner = '1';
    map.zones['Argentina'].owner = '1';
    map.zones['Peru'].owner = '1';
    // Africa
    map.zones['North Africa'].owner = '1';
    map.zones['Egypt'].owner = '1';
    map.zones['East Africa'].owner = '1';
    map.zones['Congo'].owner = '1';
    map.zones['South Africa'].owner = '1';
    // Australia
    map.zones['Indonesia'].owner = '1';
    map.zones['Western Australia'].owner = '1';
    map.zones['New Guinea'].owner = '1';
    // Europe
    map.zones['Great Britain'].owner = '1';
    map.zones['Iceland'].owner = '1';
    map.zones['Ukraine'].owner = '1';
    const continents = sortContinentsForAttack(map, '1');
    expect(continents.length).toBe(4);
    expect(continents[0].continent).toBe('Australia');
  });
  it('should get enemy zones', async () => {
    const zones = _.cloneDeep(Earth.zones);
    for (const zone in zones) {
      zones[zone].owner = '1';
    }
    zones['Argentina'].owner = '2';
    zones['Peru'].owner = '2';
    zones['Brazil'].owner = '2';
    const enemyZones = getEnemyZones(zones, playerStub().id);
    expect(enemyZones.length).toBe(3);
  });
  it('should find taken continents', async () => {
    const bot = playerStub({ id: '1' });
    const player = playerStub({ id: '2' });
    const game = await createTestingGame(gameService, {
      distributeLands: { playerId: player.id, continents: ['Africa'] },
    });
    const takenContinents = getTakenContinentsByEnemy(
      game.map.continents,
      bot.id,
    );
    expect(takenContinents.length).toBe(1);
  });
  it('should get my zones', async () => {
    const game = await createTestingGame(gameService, {
      distributeLands: { playerId: playerStub().id, all: true },
    });
    game.map.zones['Argentina'].owner = '2';
    game.map.zones['Peru'].owner = '2';
    game.map.zones['Brazil'].owner = '2';
    const zones = getMyZones(game.map.zones, playerStub().id);
    expect(zones.length).toBe(39);
  });
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
      return getZonesConnectedToContinent(game, continent);
    });
    expect(zones[0].length).toBe(6);
    expect(zones[1].length).toBe(6);
    expect(zones[2].length).toBe(3);
    expect(zones[3].length).toBe(2);
    expect(zones[4].length).toBe(4);
    expect(zones[5].length).toBe(1);
  });
  it('should find neighbour enemies', async () => {
    const game = await createTestingGame(gameService, {
      distributeLands: { playerId: playerStub().id, all: true },
    });
    game.map.zones['Peru'].owner = '2';
    game.map.zones['Brazil'].owner = '2';
    const zone = game.map.zones['Argentina'];
    const enemies = getZoneEnemies(zone, game, playerStub().id);
    expect(enemies.length).toBe(2);
    expect(enemies).toContain('Peru');
    expect(enemies).toContain('Brazil');
  });
  it('should get paths for Africa', async () => {
    const game = await createTestingGame(gameService, {
      distributeLands: { playerId: '1', all: true },
    });
    game.map.zones['Congo'].owner = '2';
    game.map.zones['Madagascar'].owner = '2';
    const paths = createPaths(game.map.zones, {
      entry: 'Congo',
      playerId: '2',
      depth: 6,
    });
    expect(paths).toBeDefined();
    expect(paths.length).toBe(20);
  });
  it('should get paths for Europe', async () => {
    const game = await createTestingGame(gameService, {
      distributeLands: { playerId: '1', all: true },
    });
    game.map.zones['Northern Europe'].owner = '2';
    game.map.zones['Ukraine'].owner = '2';
    const paths = createPaths(game.map.zones, {
      entry: 'Ukraine',
      playerId: '2',
      depth: 10,
    });
    expect(paths).toBeDefined();
    expect(paths.length).toBe(17);
  });
  it('should get attack path for Africa', async () => {
    const game = await createTestingGame(gameService, {
      distributeLands: { playerId: '1', all: true },
    });
    game.map.zones['Congo'].owner = '2';
    game.map.zones['Madagascar'].owner = '2';
    const { randomPath } = getAttackPathForContinent({
      from: 'Congo',
      playerId: '2',
      zones: game.map.zones,
      depth: 8,
    });
    expect(randomPath.length).toBe(5);
  });
  it('should get path to break South America', async () => {
    const game = await createTestingGame(gameService, {
      distributeLands: { playerId: '1', all: true },
    });
    const { shortestPath } = getPathToBreakTheContinent({
      from: 'Congo',
      to: 'Brazil',
      depth: 3,
      playerId: '2',
      zones: game.map.zones,
    });
    expect(shortestPath.length).toBe(3);
  });
  it('should get paths to break North America', async () => {
    const game = await createTestingGame(gameService, {
      distributeLands: { playerId: '1', all: true },
    });
    const { shortestPath } = getPathToBreakTheContinent({
      from: 'North Africa',
      to: 'Central America',
      depth: 5,
      playerId: '2',
      zones: game.map.zones,
    });
    expect(shortestPath.length).toBe(4);
  });
  it('should estimate required armies to attack North America', async () => {
    const game = await createTestingGame(gameService, {
      distributeLands: { playerId: '1', all: true },
    });
    game.map.zones['Argentina'].owner = '2';
    game.map.zones['Peru'].armies = 6;
    const { allPaths } = getPathToBreakTheContinent({
      from: 'Argentina',
      to: 'Central America',
      depth: 5,
      playerId: '2',
      zones: game.map.zones,
    });
    const estimate = getMinArmyEstimateAgainstPaths(allPaths, game.map.zones);
    expect(estimate.army).toBe(6);
  });
  it('should estimate required armies to attack Europe', async () => {
    const game = await createTestingGame(gameService, {
      distributeLands: { playerId: '1', all: true },
    });
    game.map.zones['North Africa'].owner = '2';
    game.map.zones['Western Europe'].armies = 10;
    game.map.zones['Southern Europe'].armies = 10;
    game.map.zones['Middle East'].armies = 2;
    game.map.zones['Egypt'].armies = 4;

    const { allPaths } = getPathToBreakTheContinent({
      from: 'North Africa',
      to: 'Ukraine',
      depth: 7,
      playerId: '2',
      zones: game.map.zones,
    });
    const estimates = getMinArmyEstimateAgainstPaths(allPaths, game.map.zones);
    expect(estimates.army).toBe(7);
  });
  it('should find best estimate for attacking Europe', async () => {
    const game = await createTestingGame(gameService, {
      distributeLands: { playerId: '1', all: true },
    });
    game.map.zones['North Africa'].owner = '2';
    game.map.zones['Quebec'].owner = '2';
    game.map.zones['Ural'].owner = '2';
    game.map.zones['Western Europe'].armies = 10;
    game.map.zones['Southern Europe'].armies = 10;
    game.map.zones['Middle East'].armies = 2;
    game.map.zones['Egypt'].armies = 4;

    const { bestEstimate } = getEstimateToBreakSingleContinent(
      game,
      'Europe',
      '2',
      6,
    );
    expect(bestEstimate.army).toBe(2);
  });
  it('should find best estimate for attacking Africa', async () => {
    const game = await createTestingGame(gameService, {
      distributeLands: { playerId: '1', all: true },
    });
    game.map.zones['Scandinavia'].owner = '2';
    game.map.zones['Egypt'].armies = 4;

    const { bestEstimate } = getEstimateToBreakSingleContinent(
      game,
      'Africa',
      '2',
      6,
    );
    expect(bestEstimate.army).toBe(6);
  });
  it('should find best estimate for attacking South America', async () => {
    const game = await createTestingGame(gameService, {
      distributeLands: { playerId: '1', all: true },
    });
    game.map.zones['Ukraine'].owner = '2';
    game.map.zones['Southern Europe'].armies = 4;
    game.map.zones['Western Europe'].armies = 4;
    game.map.zones['Egypt'].armies = 4;

    const { bestEstimate } = getEstimateToBreakSingleContinent(
      game,
      'South America',
      '2',
      6,
    );
    expect(bestEstimate.army).toBe(8);
  });
  it('should find best estimate for attacking North America', async () => {
    const game = await createTestingGame(gameService, {
      distributeLands: { playerId: '1', all: true },
    });
    game.map.zones['North Africa'].owner = '2';
    game.map.zones['Japan'].owner = '2';
    game.map.zones['Brazil'].armies = 3;
    game.map.zones['Kamchatka'].armies = 4;
    game.map.zones['Alaska'].armies = 4;
    game.map.zones['Egypt'].armies = 4;

    const { bestEstimate, all } = getEstimateToBreakSingleContinent(
      game,
      'North America',
      '2',
      6,
    );
    expect(bestEstimate.army).toBe(8);
  });
  it('should find best estimate for attacking Africa again', async () => {
    const game = await createTestingGame(gameService, {
      distributeLands: { playerId: '1', all: true },
    });
    game.map.zones['Middle East'].owner = '2';
    game.map.zones['Southern Europe'].armies = 6;
    game.map.zones['East Africa'].armies = 8;
    game.map.zones['Egypt'].armies = 8;

    const { bestEstimate } = getEstimateToBreakSingleContinent(
      game,
      'Africa',
      '2',
      6,
    );
    expect(bestEstimate.army).toBe(8);
  });
  it('should find best estimate for attacking Australia', async () => {
    const game = await createTestingGame(gameService, {
      distributeLands: { playerId: '1', all: true },
    });
    game.map.zones['Ukraine'].owner = '2';

    const { bestEstimate } = getEstimateToBreakSingleContinent(
      game,
      'Australia',
      '2',
      3,
    );
    expect(bestEstimate).toBeUndefined();
  });
  it('should get placed armies with enemies', async () => {
    const game = await createTestingGame(gameService, {
      distributeLands: { playerId: '1', all: true },
    });
    game.map.zones['Argentina'].owner = '2';
    game.map.zones['Peru'].owner = '2';
    game.map.zones['Brazil'].owner = '2';
    game.map.zones['Argentina'].armies = 4;
    game.map.zones['Peru'].armies = 4;
    game.map.zones['Brazil'].armies = 3;
    const placedArmiesWithEnemies = getPlacedArmiesWithEnemies(game, '2', 4);
    expect(placedArmiesWithEnemies.length).toBe(1);
    expect(placedArmiesWithEnemies[0].name).toBe('Peru');
  });
  it('should get best attack path for Asia', async () => {
    const game = await createTestingGame(gameService, {
      distributeLands: { playerId: '2', all: true },
    });

    game.map.continents['North America'].owner = undefined;
    game.map.zones['Alaska'].owner = '1';
    game.map.zones['Alberta'].owner = '1';
    game.map.zones['Ontario'].owner = '1';
    game.map.zones['Greenland'].owner = '1';
    game.map.zones['Western US'].owner = '1';
    game.map.zones['Eastern US'].owner = '1';

    game.map.continents['Asia'].owner = undefined;
    game.map.zones['Kamchatka'].owner = '1';
    game.map.zones['Afghanistan'].owner = '1';
    game.map.zones['Siam'].owner = '1';
    game.map.zones['China'].owner = '1';

    const path = getBestAttackPathForContinent(game, '2', 10);
    expect(path.length).toBe(4);
  });
  it('should get best attack path when having just continent', async () => {
    const game = await createTestingGame(gameService, {
      distributeLands: { playerId: '2', all: true },
    });

    game.map.continents['South America'].owner = undefined;
    game.map.zones['Brazil'].owner = '1';
    game.map.zones['Venezuela'].owner = '1';
    game.map.zones['Peru'].owner = '1';
    game.map.zones['Argentina'].owner = '1';

    const path = getBestAttackPathForContinent(game, '2', 10);
    expect(path.length).toBe(5);
  });
});
