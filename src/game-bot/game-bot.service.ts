import { Injectable } from '@nestjs/common';
import { GameService } from '../game/game.service';
import { Game, Zone } from '../game/types';
import { cloneDeep, values } from 'lodash';
import { EventLoggerService } from '../event-logger/event-logger.service';
import { EventType } from '../event-logger/types';

@Injectable()
export class GameBotService {
  constructor(
    private readonly gameService: GameService,
    private readonly eventLogger: EventLoggerService,
  ) {}

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

  placeArmies(game: Game) {
    const botId = game.currentPlayer.id;
    const zonesWithEnemies = this.getZonesWithEnemies(game, botId);

    const rand = Math.floor(Math.random() * zonesWithEnemies.length);
    const zone = zonesWithEnemies[rand];

    const zoneName = zone.name;
    this.gameService.placeArmies(
      game.gameId,
      botId,
      game.armiesThisTurn,
      zoneName,
    );
    this.eventLogger.saveGameLogs({
      gameId: game.gameId,
      event: EventType.BOT_PLACE_ARMIES,
      data: {
        zonesWithEnemies: zonesWithEnemies.map((zone) => zone.name).join(','),
        zoneName,
      },
    });
  }

  attack(game: Game) {
    const botId = game.currentPlayer.id;

    const attack = () => {
      const myZones = this.getZonesWithEnemies(game, botId)
        .sort((a, b) => (a.armies > b.armies ? -1 : 1))
        .filter((zone) => zone.armies > 1);
      const zoneFrom = myZones[0];

      console.log(zoneFrom, 'zonefrom');
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
