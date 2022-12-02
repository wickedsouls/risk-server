import { Injectable } from '@nestjs/common';
import { GameService } from '../game/game.service';
import { Continent, Game, GameStatus, Zone } from '../game/types';
import { cloneDeep, values, union, xor } from 'lodash';
import { EventLoggerService } from '../event-logger/event-logger.service';
import { EventType } from '../event-logger/types';

enum Strategy {
  AttackOccupiedContinent = 'AttackOccupiedContinent',
  AttackUnclaimedContinent = 'AttackUnclaimedContinent',
  AttackManyZones = 'AttackManyZones',
  EliminatePlayers = 'EliminatePlayers',
}

@Injectable()
export class GameBotService {
  strategy: Strategy;
  moveSequence: any;
  constructor(
    private readonly gameService: GameService,
    private readonly eventLogger: EventLoggerService,
  ) {}

  getTakenContinents(game: Game, botId: string): Continent<string, string>[] {
    const continents = values(game.map.continents).filter(
      (c) => c.owner && c.owner !== botId,
    );
    return continents;
  }

  getTakenContinentsConnectedToMyZones(
    game: Game,
    botId: string,
    _continents: Continent<string, string>[],
  ) {
    const continents = _continents.filter((c) => {
      const zones = this.getMyZonesConnectedToContinent(game, botId, c.name);
      return zones.length > 0;
    });
    return continents;
  }

  getZonesConnectedToContinent(game: Game, continent: string) {
    const continentZones = values(game.map.zones).filter((zone) => {
      return zone.continent === continent;
    });
    const continentZonesNames = continentZones.map((zone) => zone.name);
    const neighbours = continentZones.reduce(
      (total, zone) => [...total, ...zone.neighbours],
      [],
    );
    return xor(union(neighbours), continentZonesNames);
  }

  getMyZonesConnectedToContinent(game: Game, botId, continent: string) {
    return this.getZonesConnectedToContinent(game, continent).filter((zone) => {
      return game.map.zones[zone].owner === botId;
    });
  }

  getEnemyZones(game: Game, botId: string) {
    const zones = values(game.map.zones).filter((zone) => {
      return zone.owner !== botId;
    });
    this.eventLogger.saveGameLogs({
      gameId: game.gameId,
      event: EventType.BOT_GET_ENEMY_ZONES,
      data: zones.map((zone) => zone.name).join(','),
    });
    return cloneDeep(zones);
  }

  getMyZones(game: Game, botId: string) {
    const zones = values(game.map.zones).filter((zone) => {
      return zone.owner === botId;
    });
    this.eventLogger.saveGameLogs({
      gameId: game.gameId,
      event: EventType.BOT_GET_MY_ZONES,
      data: zones.map((zone) => zone.name).join(','),
    });
    return cloneDeep(zones);
  }

  getZoneEnemies = (zone: Zone<string, string>, game: Game, botId: string) => {
    const enemyZones = this.getEnemyZones(game, botId).map((z) => z.name);
    const zonesWithNeighbours = zone.neighbours.filter((n) => {
      return enemyZones.includes(n);
    });
    this.eventLogger.saveGameLogs({
      gameId: game.gameId,
      event: EventType.BOT_ZONE_ENEMIES,
      data: zonesWithNeighbours,
    });
    return cloneDeep(zonesWithNeighbours);
  };

  // It returns all player's lands that connects with enemies.
  // If all world is taken by player except Brazil, it should return 4 zones
  // Peru, Venezuela, Argentina, North Africa
  getZonesWithEnemies(game: Game, botId: string) {
    const enemyZones = this.getEnemyZones(game, botId).map((z) => z.name);
    const myZones = this.getMyZones(game, botId);
    const zonesWithEnemies = myZones.filter((zone) => {
      const hasEnemies = zone.neighbours.findIndex((n) => {
        return enemyZones.includes(n);
      });
      return hasEnemies !== -1;
    });
    return cloneDeep(zonesWithEnemies);
  }

  choseStrategy(game: Game, botId: string) {
    const takenContinents = this.getTakenContinents(game, botId);
    console.log('continentIsTaken', takenContinents);
    const connectingContinents = this.getTakenContinentsConnectedToMyZones(
      game,
      botId,
      takenContinents,
    );
    console.log('continentIsTaken', takenContinents);
    if (takenContinents.length > 0 && connectingContinents.length > 0) {
      this.strategy = Strategy.AttackOccupiedContinent;
    } else {
      this.strategy = Strategy.AttackManyZones;
    }
  }

  useBot(game: Game, botId: string) {
    this.choseStrategy(game, botId);
    console.log(this.strategy);
    this.placeArmies(game, botId);
    this.attack(game);
    this.endTurn(game);
  }

  placeArmies_AttackOccupiedContinent(
    game: Game,
    botId: string,
    rand?: boolean,
  ) {
    const occupiedContinents = this.getTakenContinents(game, botId);
    const connectedContinents = this.getTakenContinentsConnectedToMyZones(
      game,
      botId,
      occupiedContinents,
    );
    const continentIndex = rand
      ? Math.floor(Math.random() * connectedContinents.length)
      : 0;
    const continent = connectedContinents[continentIndex];
    const myZones = this.getMyZonesConnectedToContinent(
      game,
      botId,
      continent.name,
    );
    const zoneIndex = rand ? Math.floor(Math.random() * myZones.length) : 0;
    const zone = myZones[zoneIndex];
    this.gameService.placeArmies(game.gameId, botId, game.armiesThisTurn, zone);
    this.eventLogger.saveGameLogs({
      gameId: game.gameId,
      event: EventType.BOT_PLACE_ARMIES,
      data: {
        strategy: this.strategy,
        zone: zone,
      },
    });
  }

  placeArmies_AttackManyZones(game: Game, botId: string, rand?: boolean) {
    const zonesWithEnemies = this.getZonesWithEnemies(game, botId);
    const zoneIndex = rand
      ? Math.floor(Math.random() * zonesWithEnemies.length)
      : 0;
    const zone = zonesWithEnemies[zoneIndex];
    this.gameService.placeArmies(
      game.gameId,
      botId,
      game.armiesThisTurn,
      zone.name,
    );
    this.eventLogger.saveGameLogs({
      gameId: game.gameId,
      event: EventType.BOT_PLACE_ARMIES,
      data: {
        strategy: this.strategy,
        zone: zone.name,
      },
    });
  }

  placeArmies(game: Game, botId: string) {
    if (this.strategy === Strategy.AttackOccupiedContinent) {
      this.placeArmies_AttackOccupiedContinent(game, botId, true);
    } else {
      this.placeArmies_AttackManyZones(game, botId, true);
    }
  }

  attack(game: Game) {
    const botId = game.currentPlayer.id;

    const attack = () => {
      const myZones = this.getZonesWithEnemies(game, botId)
        .sort((a, b) => (a.armies > b.armies ? -1 : 1))
        .filter((zone) => zone.armies > 1);
      const zoneFrom = myZones[0];

      if (myZones.length === values(game.map.zones).length) {
        return;
      }
      if (!zoneFrom || zoneFrom.armies < 3) return;

      const neighbourEnemies = this.getZoneEnemies(zoneFrom, game, botId);
      const zoneTo = neighbourEnemies[0];

      this.eventLogger.saveGameLogs({
        gameId: game.gameId,
        event: EventType.BOT_ATTACK,
        data: {
          from: zoneFrom.name,
          to: zoneTo,
          myZones: myZones.map((zone) => zone.name),
          neighbourEnemies: neighbourEnemies,
        },
      });

      /** Stop recursive attack if conditions are met:
       * No neighbours enemies for this zone
       * Army too small: 0,1,2
       */
      if (!zoneTo) {
        return;
      }
      this.gameService.attack({
        gameId: game.gameId,
        playerId: botId,
        amount: zoneFrom.armies - 1,
        from: zoneFrom.name,
        to: zoneTo,
      });
      attack();
    };
    attack();
  }

  endTurn(game: Game) {
    const prevPlayer = game.currentPlayer.id;
    if (game.gameStatus !== GameStatus.InProgress) {
      return;
    }
    const updatedGame = this.gameService.endTurn(
      game.gameId,
      game.currentPlayer.id,
    );
    this.eventLogger.saveGameLogs({
      gameId: game.gameId,
      event: EventType.END_TURN,
      data: {
        prevPlayer: prevPlayer,
        nextPlayer: updatedGame.currentPlayer.id,
      },
    });
  }
}
