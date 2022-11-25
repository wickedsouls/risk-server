import { Injectable } from '@nestjs/common';
import { faker } from '../utils/faker';
import {
  Game,
  GameStatus,
  Map,
  Player,
  PlayerStatus,
  TurnState,
  Zone,
} from './types';
import { GameErrors } from '../common/errors';
import { CreateGameDto } from '../gateways/dtos/create-game.dto';
import { passwordEncryption } from '../utils/password-encription';
import { cloneDeep, keyBy, shuffle, values } from 'lodash';
import { Colors } from './colors';
import { getAttackResults } from './attack-results';
import { createShuffledCards, getArmyFromCards } from './utils';
import { ChatService } from '../chat/chat.service';

@Injectable()
export class GameService {
  constructor(private chatService: ChatService) {}
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

  private getPlayerData(gameId: string, playerId: string) {
    return this.games[gameId].players.find((player) => player.id === playerId);
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
    const player = this.getPlayerData(gameId, playerId);
    if (game.gameStatus === GameStatus.InProgress && !player?.status) {
      throw new Error(GameErrors.GAME_IN_PROGRESS);
    }
    if (game.gameStatus === GameStatus.Completed && player?.status) {
      return game;
    }
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
      game.players.push({ id: player.id, username: player.username });
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
      createdBy: { id: player.id, username: player.username },
      gameStatus: GameStatus.Registering,
      createdAt: new Date(),
      armiesThisTurn: 0,
      armiesFromCards: 0,
      setsOfCardsUsed: 0,
      gameCards: createShuffledCards(), // TODO: No not return to user
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
    return game;
  }

  initGame(gameId: string, map: Map<string, string>) {
    const game = this.getGameById(gameId);
    // TODO: add options to shuffle players, colors and zones
    // Load map
    this.loadMap(game, cloneDeep(map));
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
    const game = this.getGameById(gameId);
    this.checkIfPlayerIsInTheGame(gameId, playerId);
    this.checkIfItsPlayersTurn(game.currentPlayer.id, playerId);
    game.armiesThisTurn = 0;
    game.armiesFromCards = 0;

    game.currentPlayerIndex++;
    game.currentPlayer = game.players[game.currentPlayerIndex];
    while (
      game.currentPlayer &&
      (game.currentPlayer.status === PlayerStatus.Defeat ||
        game.currentPlayer.status === PlayerStatus.Surrender)
    ) {
      game.currentPlayerIndex++;
      game.currentPlayer = game.players[game.currentPlayerIndex];
    }
    if (!game.currentPlayer) {
      game.currentPlayerIndex = 0;
      game.currentPlayer = game.players[0];
    }
    this.setTurnState(gameId, TurnState.PlaceArmies);
    this.generateArmy(game.gameId);
    return game;
  }

  checkIfPlayerIsInTheGame(gameId: string, playerId: string) {
    const { players } = this.getGameById(gameId);
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
    this.checkIfPlayerOwnsTheZone(playerId, game, zoneName);
    if (!amount || amount > game.armiesThisTurn) {
      throw new Error(GameErrors.UNAUTHORIZED);
    }
    game.map.zones[zoneName].armies += amount;
    game.armiesThisTurn -= amount;
    game.armiesFromCards = 0;
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
    const defenderId = defender.owner;
    const attackingPlayer = this.getPlayerData(gameId, playerId);
    const defendingPlayer = this.getPlayerData(gameId, defenderId);

    if (game.armiesThisTurn !== 0) {
      throw new Error(GameErrors.PLACE_ALL_ARMIES);
    }
    this.checkIfItsPlayersTurn(game.currentPlayer.id, playerId);
    this.checkIfPlayerOwnsTheZone(playerId, game, from);
    this.checkIfZoneHasValidNeighbour(attacker, to);
    if (defenderId === playerId) {
      throw new Error(GameErrors.BAD_REQUEST);
    }
    this.setTurnState(gameId, TurnState.Attack);
    if (amount >= attacker.armies) {
      throw new Error(GameErrors.AMOUNT_TOO_LARGE);
    }

    console.log('------------------');
    console.log('amount:', amount);

    this.chatService.setMessage('', gameId, attackingPlayer);
    this.chatService.setMessage(
      `${amount} vs ${defender.armies}`,
      gameId,
      attackingPlayer,
    );
    const {
      attackerArmy,
      defenderArmy,
      attackingDiceRolls,
      defendingDiceRolls,
    } = getAttackResults(amount, defender.armies);

    if (defenderArmy === 0) {
      attacker.armies -= amount;
      defender.owner = attacker.owner;
      defender.armies = attackerArmy;
      this.loseContinent(gameId, to);
      this.winContinent(gameId, playerId, to);
      this.eliminatePlayer(gameId, playerId, defenderId);
      this.checkForWin(gameId);
    } else if (attackerArmy === 0) {
      attacker.armies -= amount;
      defender.armies = defenderArmy;
    } else {
      throw Error(GameErrors.UNEXPECTED_ATTACK_RESULTS);
    }
    attackingDiceRolls.forEach((_, i) => {
      this.chatService.setMessage(
        `rolls ${attackingDiceRolls[i].join(',')}`,
        gameId,
        attackingPlayer,
      );
      this.chatService.setMessage(
        `rolls ${defendingDiceRolls[i].join(',')}`,
        gameId,
        defendingPlayer,
      );
    });
    return game;
  }

  private winContinent(gameId: string, playerId: string, zoneName: string) {
    const { map } = this.getGameById(gameId);
    const continentName = map.zones[zoneName].continent;
    const ownedZones = values(map.zones).filter((z) => {
      return z.owner === playerId && z.continent === continentName;
    });
    if (map.continents[continentName].zoneCount === ownedZones.length) {
      map.continents[continentName].owner = playerId;
      this.addCard(gameId, playerId);
      return true;
    }
    return false;
  }

  private loseContinent(gameId: string, zoneName: string) {
    const { map } = this.getGameById(gameId);
    const { continent } = map.zones[zoneName];
    if (map.continents[continent].owner) {
      map.continents[continent].owner = undefined;
    }
  }

  addCard(gameId: string, playerId: string) {
    const game = this.getGameById(gameId);
    const player = this.getPlayerData(gameId, playerId);
    const [card] = game.gameCards.splice(0, 1);
    player.cards ? player.cards.push(card) : (player.cards = [card]);
    if (game?.gameCards.length === 0) {
      game.gameCards = createShuffledCards();
    }
  }

  useCards(gameId: string, playerId: string) {
    console.log('-----------');
    const game = this.getGameById(gameId);
    this.checkIfPlayerIsInTheGame(gameId, playerId);
    this.checkIfItsPlayersTurn(game.currentPlayer.id, playerId);
    const player = this.getPlayerData(gameId, playerId);
    const result = getArmyFromCards(player.cards || [], game.setsOfCardsUsed);
    if (result) {
      const { cards, army, incrementCount } = result;
      console.log('result.cards', cards);
      console.log('result.incrementCount', incrementCount);
      console.log('result.army', army);
      player.cards = cards;
      game.armiesFromCards = army;
      game.armiesThisTurn += army;
      game.setsOfCardsUsed++;
    } else {
      console.log('no result');
    }
    return game;
  }

  surrender(gameId: string, playerId: string) {
    const game = this.getGameById(gameId);
    this.checkIfPlayerIsInTheGame(gameId, playerId);
    game.players = game.players.map((player: Player): Player => {
      return player.id === playerId
        ? { ...player, status: PlayerStatus.Surrender }
        : player;
    });
    if (game.currentPlayer.id === playerId) {
      this.endTurn(gameId, playerId);
    }
    this.checkForWin(gameId);
    return game;
  }

  checkForWin(gameId: string) {
    const game = this.getGameById(gameId);
    const alivePlayers = game.players.filter((player) => {
      return ![
        PlayerStatus.Defeat,
        PlayerStatus.Deserter,
        PlayerStatus.Surrender,
      ].includes(player.status);
    });
    if (alivePlayers.length === 1) {
      alivePlayers[0].status = PlayerStatus.Win;
      game.gameStatus = GameStatus.Completed;
    }
  }

  eliminatePlayer(gameId: string, attackerId: string, defenderId: string) {
    const { map, players } = this.getGameById(gameId);
    const isInTheGame = values(map.zones).find(
      (zone) => zone.owner === defenderId,
    );
    if (!isInTheGame) {
      players.forEach((player) => {
        if (player.id === defenderId) {
          player.status = PlayerStatus.Defeat;
        }
      });
    }
  }

  getZoneCount(game) {
    return values(game.map.zones).length;
  }

  generateArmy(gameId: string) {
    const game = this.getGameById(gameId);
    const DIVIDER = 3;

    let armiesFromZones = values(game.map.zones)
      .filter((zone) => {
        return zone.owner === game.currentPlayer.id;
      })
      .reduce((total) => total + 1, 0);
    // Player gets armies / 3, but always at least 3
    armiesFromZones =
      armiesFromZones / DIVIDER < 3 ? 3 : Math.floor(armiesFromZones / DIVIDER);

    const armiesFromContinents = values(game.map.continents)
      .filter((c) => {
        return c.owner === game.currentPlayer.id;
      })
      .reduce((total, c) => total + c.reward, 0);

    const armiesThisTurn = armiesFromZones + armiesFromContinents;
    game.armiesThisTurn = armiesThisTurn;
    return armiesThisTurn;
  }
}
