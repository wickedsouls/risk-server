import { Injectable } from '@nestjs/common';
import { GameService } from '../game/game.service';
import { Game, GameStatus, TurnState } from '../game/types';
import { EventLoggerService } from '../event-logger/event-logger.service';
import { getMyZones, getTakenContinentsByEnemy } from './utils';
import { getBestPathToBreakContinent } from './utils/get-best-path-to-break-continent';
import { getAttackPathForContinent } from './utils/get-attack-path-for-continent';
import { getBestAttackPathForContinent } from './utils/get-best-attack-path-for-continent';
import { getPlacedArmiesWithEnemies } from './utils/get-placed-armies-with-enemies';
import { getMinArmyEstimateAgainstPaths } from './utils/get-min-army-estimate-against-paths';
import { rng } from '../utils/rng';
import _ from 'lodash';

export enum Strategy {
  AttackOccupiedContinent = 'AttackOccupiedContinent',
  AttackUnclaimedContinent = 'AttackUnclaimedContinent',
  Defend = 'Defend',
  EliminatePlayers = 'EliminatePlayers',
}

@Injectable()
export class GameBotService {
  mainAttack: { path?: string[]; strategy?: Strategy; army?: number } = {};
  constructor(
    private readonly gameService: GameService,
    private readonly eventLogger: EventLoggerService,
  ) {}

  defineAttackPaths(game: Game, botId: string) {
    const takenContinents = getTakenContinentsByEnemy(
      game.map.continents,
      botId,
    );
    const armiesThisTurn = game.armiesThisTurn;
    let depth = Math.ceil(armiesThisTurn / 2);
    depth = depth < 6 ? depth : 6;
    const pathToBreakContinent = getBestPathToBreakContinent(
      game,
      botId,
      depth,
    );

    if (
      takenContinents &&
      pathToBreakContinent &&
      pathToBreakContinent.army < 4
    ) {
      this.mainAttack = {
        path: pathToBreakContinent.path,
        strategy: Strategy.AttackOccupiedContinent,
        army: game.armiesThisTurn,
      };
    } else {
      const path = getBestAttackPathForContinent(game, botId, depth);
      this.mainAttack = {
        path,
        strategy: Strategy.AttackUnclaimedContinent,
        army: game.armiesThisTurn,
      };
    }
  }

  buildNewAttackPath(
    game: Game,
    from: string,
    playerId: string,
    depth: number,
  ) {
    const { randomPath } = getAttackPathForContinent({
      from,
      playerId,
      zones: game.map.zones,
      noContinentFilter: true,
      depth,
    });
    return randomPath;
  }

  useBot(game: Game, playerId: string) {
    this.gameService.useCards(game.gameId, playerId);
    this.defineAttackPaths(game, playerId);
    this.placeArmies(game, playerId);
    this.attack(game, playerId);
    this.attackWithOtherArmies(game, playerId);
    this.moveArmy(game, playerId);
  }

  placeArmies(game: Game, playerId: string) {
    if (game.gameStatus === GameStatus.Completed) return;
    this.gameService.placeArmies(
      game.gameId,
      playerId,
      this.mainAttack.army,
      this.mainAttack.path[0],
    );
  }

  moveArmy(game: Game, playerId: string) {
    if (game.gameStatus === GameStatus.Completed) return;
    const allEntryPoints = _.flatten(
      _.values(game.map.continents).map((c) => c.entryPoints),
    );
    const [armyToMove] = getMyZones(game.map.zones, playerId)
      .filter((zone) => zone.armies > 1)
      .filter((zone) => !allEntryPoints.includes(zone.name))
      .filter((zone) => {
        const hasEnemies = zone.neighbours.find((n) => {
          return game.map.zones[n].owner !== playerId;
        });
        return !hasEnemies;
      })
      .sort((a, b) => (a.armies < b.armies ? 1 : -1));

    if (!armyToMove) return;

    let armySizeToMove = armyToMove.armies - 1;
    if (armyToMove.armies > 7) armySizeToMove = 7;

    this.gameService.setTurnState(game.gameId, TurnState.Move);

    const zoneNeighboursWithEnemies = armyToMove.neighbours.filter((zone) => {
      const hasEnemies = game.map.zones[zone].neighbours.find((n) => {
        return game.map.zones[n].owner !== playerId;
      });
      return hasEnemies;
    });
    if (zoneNeighboursWithEnemies.length > 0) {
      const to = rng.getRandomArrayItem(zoneNeighboursWithEnemies);
      return this.gameService.moveArmy(
        game.gameId,
        playerId,
        armySizeToMove,
        armyToMove.name,
        to,
      );
    }

    const zoneNeighboursAsEntries = armyToMove.neighbours.filter((zone) => {
      return allEntryPoints.includes(zone);
    });
    if (zoneNeighboursAsEntries.length > 0) {
      const to = rng.getRandomArrayItem(zoneNeighboursAsEntries);
      return this.gameService.moveArmy(
        game.gameId,
        playerId,
        armySizeToMove,
        armyToMove.name,
        to,
      );
    }
    const to = rng.getRandomArrayItem(armyToMove.neighbours);
    this.gameService.moveArmy(
      game.gameId,
      playerId,
      armySizeToMove,
      armyToMove.name,
      to,
    );
  }

  attack(game: Game, playerId: string) {
    if (game.gameStatus === GameStatus.Completed) return;
    this.mainAttack.path.forEach((zone, i) => {
      const from = zone;
      const to = this.mainAttack.path[i + 1];
      const amount = game.map.zones[from].armies - 1;
      if (!to && amount >= 3) {
        return this.continueAttack(game, playerId, from);
      }
      if (!from || !to || amount < 2) return;
      if (game.map.zones[from].owner !== playerId) return;
      this.gameService.attack({
        gameId: game.gameId,
        playerId,
        from,
        to,
        amount: game.map.zones[from].armies - 1,
      });
    });
  }

  continueAttack(game: Game, playerId: string, zoneFrom: string) {
    if (game.gameStatus === GameStatus.Completed) return;
    const depth = Math.floor(game.map.zones[zoneFrom].armies / 2);
    const path = this.buildNewAttackPath(game, zoneFrom, playerId, depth);
    path.forEach((zone, i) => {
      const from = zone;
      const to = path[i + 1];
      const amount = game.map.zones[from].armies - 1;
      if (!from || !to || amount < 2) return;
      if (game.gameStatus === GameStatus.Completed) return;
      if (game.map.zones[from].owner !== playerId) return;
      this.gameService.attack({
        gameId: game.gameId,
        playerId,
        from,
        to,
        amount,
      });
    });
  }

  attackWithOtherArmies(game: Game, playerId) {
    if (game.gameStatus === GameStatus.Completed) return;
    const placedArmiesWithEnemies = getPlacedArmiesWithEnemies(
      game,
      playerId,
      4,
    );
    placedArmiesWithEnemies.forEach((zone) => {
      const depth = Math.ceil(zone.armies / 2);
      const path = this.buildNewAttackPath(game, zone.name, playerId, depth);
      path.forEach((zone, i) => {
        const from = zone;
        const to = path[i + 1];
        const amount = game.map.zones[from].armies - 1;
        if (!from || !to || amount < 2) return;
        if (game.gameStatus === GameStatus.Completed) return;
        if (game.map.zones[from].owner !== playerId) return;
        this.gameService.attack({
          gameId: game.gameId,
          playerId,
          from,
          to,
          amount,
        });
      });
    });
  }
}
