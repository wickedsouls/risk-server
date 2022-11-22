import { Injectable } from '@nestjs/common';
import { faker } from '../utils/faker';
import { Game, GameStatus, Map, Player, TurnState, Zone } from './types';
import { GameErrors } from '../common/errors';
import { CreateGameDto } from '../gateways/dtos/create-game.dto';
import { passwordEncryption } from '../utils/password-encription';
import shuffle from 'lodash.shuffle';
import values from 'lodash.values';
import keyBy from 'lodash.keyby';
import { Colors } from './colors';

@Injectable()
export class GameService {
  games: { [key: string]: Game } = {};

  static gameError(message: GameErrors) {
    return { error: true, message };
  }

  private getGameById(gameId: string): Game {
    if (!gameId || !this.games[gameId]) {
      throw new Error(GameErrors.GAME_NOT_FOUND);
    } else {
      return this.games[gameId];
    }
  }

  startGame(gameId: string, playerId: string) {
    const game = this.getGameById(gameId);
    if (game.players.length < game.minPlayers) {
      throw new Error(GameErrors.BAD_REQUEST);
    }
    if (game.gameStatus !== GameStatus.Registering) {
      throw new Error(GameErrors.BAD_REQUEST);
    }
    if (game.createdBy.id !== playerId) {
      throw new Error(GameErrors.UNAUTHORIZED);
    }
    game.gameStatus = GameStatus.InProgress;
    return game;
  }

  leaveTheGame(gameId: string, playerId: string) {
    const game = this.getGameById(gameId);
    this.games[gameId].players = game.players.filter(
      (player) => player.id !== playerId,
    );
    if (game.players.length === 0) {
      delete this.games[gameId];
    }
    return game;
  }

  async joinTheGame(gameId: string, player: Player, password?: string) {
    const game = this.getGameById(gameId);
    if (game.isPrivate && !password) {
      throw new Error(GameErrors.PASSWORD_IS_REQUIRED);
    }
    if (game.isPrivate) {
      const match = await passwordEncryption.verifyPassword(
        password,
        game.password,
      );
      if (!match) throw new Error(GameErrors.INVALID_PASSWORD);
    }
    if (game.gameStatus === GameStatus.Completed) {
      throw new Error(GameErrors.GAME_HAS_ENDED);
    }
    if (game.gameStatus === GameStatus.InProgress) {
      throw new Error(GameErrors.GAME_IN_PROGRESS);
    }
    if (game.maxPlayers === game.players.length) {
      throw new Error(GameErrors.GAME_IS_FULL);
    }
    if (!game.players.find((p) => p.id === player.id)) {
      game.players.push(player);
    }
    return game;
  }

  async createGame(data: CreateGameDto, player: Player) {
    const { isPrivate, password, maxPlayers, minPlayers } = data;
    if (isPrivate && !password) {
      throw new Error(GameErrors.PASSWORD_IS_REQUIRED);
    }
    let hash: string;
    if (isPrivate) {
      hash = await passwordEncryption.hashPassword(password);
    }
    const gameId = faker.createName();
    const game: Game = {
      players: [],
      isPrivate,
      currentPlayer: undefined,
      gameId,
      password: hash || password,
      maxPlayers,
      minPlayers,
      createdBy: player,
      gameStatus: GameStatus.Registering,
      createdAt: new Date(),
    };
    this.games[gameId] = game;
    return game;
  }

  cancelGame(gameId: string, userId: string) {
    const game = this.getGameById(gameId);
    if (game.createdBy.id !== userId) {
      throw new Error(GameErrors.UNAUTHORIZED);
    }
    if (game.gameStatus === GameStatus.InProgress) {
      throw new Error(GameErrors.GAME_HAS_STARTED);
    }
    this.games[gameId] = undefined;
  }

  getAllGames() {
    return this.games;
  }

  getGameInfo(gameId: string, playerId: string) {
    const game = this.getGameById(gameId);
    this.checkIfPlayerIsInTheGame(gameId, playerId);
    if (game.isPrivate) {
      throw new Error(GameErrors.UNAUTHORIZED);
    }
    return game;
  }

  initGame(gameId: string, map: Map<string, string>) {
    const game = this.getGameById(gameId);

    // Load map
    this.loadMap(game, map);
    // Shuffle players
    // this.shufflePlayers(game);
    // Assign colors
    this.assignPlayerColors(game);
    // Assign active player
    game.currentPlayer = game.players[0];
    game.currentPlayerIndex = 0;
    game.turnState = TurnState.PlaceArmies;
    // Distribute land
    this.distributeLands(game);
    // Generate army
    this.generateArmy(gameId);
    return game;
  }

  loadMap(game: Game, map: Map<string, string>) {
    game.map = map;
  }

  shufflePlayers(game: Game) {
    game.players = shuffle(game.players);
  }

  assignPlayerColors(game: Game) {
    const colors = shuffle(Colors);
    game.players.map((player, i) => {
      player.color = colors[i];
    });
  }

  setTurnState(gameId: string, turn: TurnState) {
    const game = this.getGameById(gameId);
    game.turnState = turn;
  }

  distributeLands(game: Game) {
    const zones = shuffle(values(game.map.zones));
    const { players } = game;
    // Reverse players, so that the last one gets more armies in case
    // zones are not equally divided
    const reversedPlayers = players.slice().reverse();

    const mappedZones = zones.map((zone, i) => {
      const modulus = i % players.length;
      return { ...zone, armies: 1, owner: reversedPlayers[modulus].id };
    });

    game.map.zones = keyBy(mappedZones, 'name');
  }

  endTurn(gameId: string, playerId: string) {
    // TODO: Ignore players that lost
    const game = this.getGameById(gameId);
    this.checkIfPlayerIsInTheGame(gameId, playerId);
    this.checkIfItsPlayersTurn(game.currentPlayer.id, playerId);
    game.armiesThisTurn = 0;
    let index = game.currentPlayerIndex + 1;
    if (index === game.players.length) index = 0;
    game.currentPlayerIndex = index;
    game.currentPlayer = game.players[index];
    this.setTurnState(gameId, TurnState.PlaceArmies);
    this.generateArmy(game.gameId);
    return game;
  }

  checkIfPlayerIsInTheGame(gameId: string, playerId: string) {
    // Check if he was eliminated
    console.log('checkIfPlayerIsInTheGame', 'gid:', gameId, 'pid:', playerId);
    const { players } = this.getGameById(gameId);
    console.log(players);
    const player = players.find((p) => p.id === playerId);
    if (!player) throw new Error(GameErrors.UNAUTHORIZED);
    return player;
  }

  checkIfItsPlayersTurn(currentPlayerId: string, playerId: string) {
    if (currentPlayerId !== playerId) {
      throw new Error(GameErrors.UNAUTHORIZED);
    }
  }

  checkIfPlayerOwnsTheZone(playerId: string, game: Game, zoneName: string) {
    if (game.map.zones[zoneName].owner !== playerId) {
      throw new Error(GameErrors.UNAUTHORIZED);
    }
  }

  checkIfZoneHasValidNeighbour(zone: Zone<string, string>, neighbour: string) {
    if (!zone.neighbours.includes(neighbour)) {
      throw new Error(GameErrors.BAD_REQUEST);
    }
  }

  finishAttack(gameId: string, playerId: string) {
    this.checkIfPlayerIsInTheGame(gameId, playerId);
    const game = this.getGameById(gameId);
    if (game.currentPlayer.id !== playerId) {
      throw new Error(GameErrors.UNAUTHORIZED);
    }
    if (game.turnState !== TurnState.Attack) {
      throw new Error(GameErrors.BAD_REQUEST);
    }
    game.turnState = TurnState.Move;
    return game;
  }

  placeArmies(
    gameId: string,
    playerId: string,
    amount: number,
    zoneName: string,
  ) {
    this.checkIfPlayerIsInTheGame(gameId, playerId);
    const game = this.getGameById(gameId);
    this.checkIfItsPlayersTurn(game.currentPlayer.id, playerId);
    console.log(playerId, game.gameId, zoneName, 'pid, gid, zone');
    this.checkIfPlayerOwnsTheZone(playerId, game, zoneName);
    if (!amount || amount > game.armiesThisTurn) {
      throw new Error(GameErrors.UNAUTHORIZED);
    }
    game.map.zones[zoneName].armies += amount;
    game.armiesThisTurn -= amount;
    if (game.armiesThisTurn === 0) {
      game.turnState = TurnState.Attack;
    }
    return game;
  }

  moveArmy(
    gameId: string,
    playerId: string,
    amount: number,
    from: string,
    to: string,
  ) {
    const game = this.getGameById(gameId);
    this.checkIfPlayerIsInTheGame(gameId, playerId);
    const zoneFrom = game.map.zones[from];
    const zoneTo = game.map.zones[to];
    console.log('move');
    if (game.turnState !== TurnState.Move) {
      console.log(game.turnState, TurnState.Move);
      throw new Error(GameErrors.TURN_STATE_INVALID);
    }
    if (zoneFrom.owner !== playerId || zoneTo.owner !== playerId) {
      throw new Error(GameErrors.UNAUTHORIZED);
    }
    if (!zoneFrom.neighbours.includes(zoneTo.name)) {
      throw new Error(GameErrors.ZONE_IS_NOT_AN_NEIGHBOUR);
    }
    if (amount > 7 || amount >= zoneFrom.armies) {
      throw new Error(GameErrors.AMOUNT_TOO_LARGE);
    }
    game.map.zones[from].armies -= amount;
    game.map.zones[to].armies += amount;
    this.endTurn(gameId, playerId);
    return game;
  }

  attack(
    gameId: string,
    playerId: string,
    amount: number,
    from: string,
    to: string,
  ) {
    this.checkIfPlayerIsInTheGame(gameId, playerId);
    const game = this.getGameById(gameId);
    const attacker = game.map.zones[from];
    const defender = game.map.zones[to];
    if (game.armiesThisTurn !== 0) {
      throw new Error(GameErrors.PLACE_ALL_ARMIES);
    }
    this.checkIfItsPlayersTurn(game.currentPlayer.id, playerId);
    this.checkIfPlayerOwnsTheZone(playerId, game, from);
    this.checkIfZoneHasValidNeighbour(attacker, to);
    if (defender.owner === playerId) {
      throw new Error(GameErrors.BAD_REQUEST);
    }
    this.setTurnState(gameId, TurnState.Attack);
    if (amount >= attacker.armies) {
      console.log('Amount too large');
      throw new Error(GameErrors.BAD_REQUEST);
    }
    const damage = amount - defender.armies;
    console.log('damage:', damage);
    if (damage > 0) {
      // win - attacker wins
      console.log(attacker.name, 'win');
      attacker.armies -= amount;
      defender.owner = attacker.owner;
      defender.armies = damage;
    } else if (damage <= 0) {
      // lose - attacker loses
      console.log(attacker.name, 'lose');
      attacker.armies -= amount;
      defender.armies = defender.armies - amount || 1;
    }
    return game;
  }

  private winContinent(gameId: string, playerId: string, zone: string) {
    const { map } = this.getGameById(gameId);
    const continentName = map.zones[zone].continent;
    const ownedZones = values(map.zones).filter((z) => {
      // console.log(z.owner);
      return z.owner === playerId && z.continent === continentName;
    });
    // console.log(ownedZones.length, 'elnt');
    if (map.continents[continentName].zoneCount === ownedZones.length) {
      map.continents[continentName].owner = playerId;
      return true;
    }
    return false;
  }

  addCard() {}

  useCard() {}

  checkForWin() {}

  checkForLose() {}

  surender() {}

  getZoneCount(game) {
    return values(game.map.zones).length;
  }

  generateArmy(gameId: string) {
    const game = this.getGameById(gameId);
    const DIVIDER = 3;
    const armies = values(game.map.zones)
      .filter((zone) => {
        return zone.owner === game.currentPlayer.id;
      })
      .reduce((total) => total + 1, 0);
    // Player gets armies / 3, but always at least 3
    const armiesThisTurn =
      armies / DIVIDER < 3 ? 3 : Math.floor(armies / DIVIDER);
    game.armiesThisTurn = armiesThisTurn;
    return armiesThisTurn;
  }
}
