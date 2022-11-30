import { Injectable } from '@nestjs/common';
import { faker } from '../utils/faker';
import {
  CreateGameDto,
  Game,
  GameStatus,
  Map,
  Player,
  PlayerStatus,
  StartGameOptions,
  TurnState,
  Zone,
} from './types';
import { GameErrors } from '../common/errors';
import { passwordEncryption } from '../utils/password-encription';
import { cloneDeep, keyBy, shuffle, values } from 'lodash';
import { Colors } from '../common/constants';
import {
  checkIfDistributionIsCorrect,
  createShuffledCards,
  getArmyFromCards,
  getDiceAttackResults,
  getPreciseAttackResults,
  shuffleZones,
} from './utils';
import { ChatService } from '../chat/chat.service';
import { EventLoggerService } from '../event-logger/event-logger.service';
import { EventType } from '../event-logger/types';

@Injectable()
export class GameService {
  constructor(
    private chatService: ChatService,
    private eventLogger: EventLoggerService,
  ) {}
  games: { [key: string]: Game } = {};
  playerTurnTimeout: { [key: string]: ReturnType<typeof setTimeout> } = {};

  static gameError(message: GameErrors) {
    return { error: true, message };
  }

  private getGameById(gameId: string): Game {
    if (!gameId || !this.games[gameId]) {
      this.eventLogger.saveGameLogs({
        gameId,
        event: GameErrors.GAME_NOT_FOUND,
        data: { gameId },
      });
      throw new Error(GameErrors.GAME_NOT_FOUND);
    } else {
      return this.games[gameId];
    }
  }

  private getPlayerData(gameId: string, playerId: string) {
    return this.games[gameId].players.find((player) => player.id === playerId);
  }

  checkIfPlayerIsInTheGame(gameId: string, playerId: string) {
    const { players } = this.getGameById(gameId);
    const player = players.find((p) => p.id === playerId);
    if (!player) {
      this.eventLogger.saveGameLogs({
        gameId,
        event: GameErrors.PLAYER_NOT_IN_THE_GAME,
        data: { players, gameId, playerId },
      });
      throw new Error(GameErrors.PLAYER_NOT_IN_THE_GAME);
    }
    return player;
  }

  checkIfItsPlayersTurn(
    currentPlayerId: string,
    playerId: string,
    skipValidation?: boolean,
  ) {
    if (skipValidation) return;
    if (currentPlayerId !== playerId) {
      this.eventLogger.saveGameLogs({
        gameId: playerId,
        event: GameErrors.NOT_YOUR_TURN,
        data: { currentPlayerId, playerId },
      });
      throw new Error(GameErrors.NOT_YOUR_TURN);
    }
  }

  checkIfPlayerOwnsTheZone(playerId: string, game: Game, zoneName: string) {
    if (game.map.zones[zoneName].owner !== playerId) {
      this.eventLogger.saveGameLogs({
        gameId: playerId,
        event: GameErrors.NOT_YOUR_ZONE,
        data: { zone: game.map.zones[zoneName], playerId },
      });
      throw new Error(GameErrors.NOT_YOUR_ZONE);
    }
  }

  checkIfZoneHasValidNeighbour(zone: Zone<string, string>, neighbour: string) {
    if (!zone.neighbours.includes(neighbour)) {
      this.eventLogger.saveGameLogs({
        gameId: '',
        event: GameErrors.NO_VALID_NEIGHBOURS,
        data: { zone, neighbour },
      });
      throw new Error(GameErrors.NO_VALID_NEIGHBOURS);
    }
  }

  checkIfPlayerIsGameCreator(gameId: string, playerId: string) {
    const game = this.getGameInfo(gameId, playerId);
    if (game.createdBy.id !== playerId) {
      this.eventLogger.saveGameLogs(
        {
          gameId: gameId,
          event: GameErrors.PLAYER_IS_NOT_THE_CREATOR,
          data: { game, gameId, playerId },
        },
        { emit: ['map'] },
      );
      throw new Error(GameErrors.PLAYER_IS_NOT_THE_CREATOR);
    }
  }

  async createGame(player: Player, data: CreateGameDto) {
    const { isPrivate, password, maxPlayers, minPlayers, map } = data;
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
      timeout: 0,
      map: cloneDeep(map),
    };
    this.games[gameId] = game;
    this.eventLogger.saveGameLogs(
      { gameId, event: EventType.CREATE_GAME, data: game },
      { emit: ['map'] },
    );
    return game;
  }

  startGame(gameId: string, playerId: string, options: StartGameOptions = {}) {
    const {
      usePrecision,
      endTurn,
      shufflePlayers = true,
      shuffleColors = true,
    } = options;
    const game = this.getGameById(gameId);
    if (game.players.length < game.minPlayers) {
      throw new Error(GameErrors.NOT_ENOUGH_PLAYERS);
    }
    if (game.gameStatus !== GameStatus.Registering) {
      throw new Error(GameErrors.GAME_HAS_STARTED);
    }
    if (game.createdBy.id !== playerId) {
      throw new Error(GameErrors.UNAUTHORIZED);
    }

    game.gameStatus = GameStatus.InProgress;

    if (shufflePlayers) this.shufflePlayers(game);
    if (shuffleColors) this.assignPlayerColors(game);
    game.gameCards = createShuffledCards(); // TODO: private..
    game.turnState = TurnState.PlaceArmies;
    game.usePrecision = usePrecision;
    game.currentPlayerIndex = 0;
    game.currentPlayer = game.players[0];
    this.distributeLands(game);
    this.generateArmy(gameId);
    if (endTurn) this.setTimeToAct(game, endTurn);

    this.eventLogger.saveGameLogs(
      {
        gameId,
        event: EventType.START_GAME,
        data: game,
      },
      { emit: ['map', 'gameCards'] },
    );
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
    this.eventLogger.saveGameLogs({
      gameId,
      event: EventType.LEAVE_GAME,
      data: game.players,
    });
    return game;
  }

  addAiPlayer(gameId: string, playerId: string) {
    this.checkIfPlayerIsInTheGame(gameId, playerId);
    this.checkIfPlayerIsGameCreator(gameId, playerId);
    const game = this.getGameById(gameId);
    if (game.gameStatus !== GameStatus.Registering) {
      throw new Error(GameErrors.REGISTRATION_HAS_ENDED);
    }
    const botName = faker.createName();
    const bot = {
      id: botName,
      username: botName,
      title: 'AI',
      isBot: true,
      botLevel: 1,
      status: PlayerStatus.InGame,
    };
    game.players.push(bot);
    this.eventLogger.saveGameLogs({
      gameId,
      event: EventType.ADD_AI,
      data: bot,
    });
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
      game.players.push({
        id: player.id,
        username: player.username,
        status: PlayerStatus.InGame,
      });
    }
    this.eventLogger.saveGameLogs({
      gameId,
      event: EventType.JOIN_GAME,
      data: game.players.map((p) => p.username),
    });
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
    const { players } = game;
    const mappedZones = shuffleZones(game.map.zones, players);
    const correct = checkIfDistributionIsCorrect(
      game.map.continents,
      mappedZones,
    );
    if (!correct) return this.distributeLands(game);
    game.map.zones = keyBy(mappedZones, 'name');
  }

  endTurn(gameId: string, playerId: string, endTurn?: () => void) {
    const game = this.getGameById(gameId);
    if (game.gameStatus !== GameStatus.InProgress) {
      this.eventLogger.saveGameLogs({
        gameId,
        event: GameErrors.GAME_HAS_NOT_STARTED,
        data: game.gameStatus,
      });
      throw new Error(GameErrors.GAME_HAS_NOT_STARTED);
    }
    this.checkIfPlayerIsInTheGame(gameId, playerId);
    this.checkIfItsPlayersTurn(game.currentPlayer.id, playerId);

    game.armiesThisTurn = 0;
    game.armiesFromCards = 0;

    (function changePlayer() {
      game.currentPlayerIndex++;
      game.currentPlayer = game.players[game.currentPlayerIndex];
      if (!game.currentPlayer) {
        game.currentPlayerIndex = 0;
        game.currentPlayer = game.players[0];
      }
      if (game.currentPlayer.status !== PlayerStatus.InGame) {
        changePlayer();
      }
    })();

    this.setTurnState(gameId, TurnState.PlaceArmies);
    this.generateArmy(game.gameId);

    this.setTimeToAct(game, endTurn);
    this.eventLogger.saveGameLogs(
      {
        gameId,
        event: EventType.END_TURN,
        data: { prevPlayer: playerId, nextPlayer: game.currentPlayer.id },
      },
      { emit: ['map', 'gameCards'] },
    );
    return game;
  }

  setTimeToAct(game: Game, cb) {
    if (game?.gameStatus !== GameStatus.InProgress) return;
    clearTimeout(this.playerTurnTimeout[game.gameId]);
    const timeout = (30 + game.armiesThisTurn * 5) * 1000;
    game.timeout = timeout;
    if (cb) {
      this.playerTurnTimeout[game.gameId] = setTimeout(() => {
        cb();
      }, timeout);
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
    this.eventLogger.saveGameLogs({
      gameId,
      event: EventType.PLACE_ARMIES,
      data: { playerId, name: game.map.zones[zoneName].name, amount },
    });
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
    if (game.turnState !== TurnState.Move) {
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
    this.eventLogger.saveGameLogs({
      gameId,
      event: EventType.MOVE_ARMIES,
      data: {
        playerId,
        from: game.map.zones[from].armies,
        to: game.map.zones[to].armies,
      },
    });
    return game;
  }

  attack(options: {
    gameId: string;
    playerId: string;
    amount: number;
    from: string;
    to: string;
  }) {
    const { gameId, playerId, to, amount, from } = options;
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

    this.chatService.setMessage('', gameId, attackingPlayer);
    this.chatService.setMessage(
      `${amount} vs ${defender.armies}`,
      gameId,
      attackingPlayer,
    );
    const usePrecision = game.usePrecision;
    const {
      attackerArmy,
      defenderArmy,
      attackingDiceRolls,
      defendingDiceRolls,
    } = usePrecision
      ? getPreciseAttackResults(amount, defender.armies)
      : getDiceAttackResults(amount, defender.armies);

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
    this.eventLogger.saveGameLogs({
      gameId,
      event: EventType.ATTACK,
      data: {
        attackingDiceRolls: attackingDiceRolls.map((value) => value.join(',')),
        defendingDiceRolls: defendingDiceRolls.map((value) => value.join(',')),
        from: game.map.zones[from],
        to: game.map.zones[to],
      },
    });
    return game;
  }

  private winContinent(gameId: string, playerId: string, zoneName: string) {
    const { map } = this.getGameById(gameId);
    const continentName = map.zones[zoneName].continent;
    const ownedZones = values(map.zones).filter((z) => {
      return z.owner === playerId && z.continent === continentName;
    });
    if (map.continents[continentName].zoneCount !== ownedZones.length) {
      return false;
    }
    map.continents[continentName].owner = playerId;
    this.addCard(gameId, playerId);
    this.eventLogger.saveGameLogs({
      gameId,
      event: EventType.WIN_CONTINENT,
      data: map.continents[continentName],
    });
    return true;
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
    this.eventLogger.saveGameLogs({
      gameId,
      event: EventType.ADD_CARD,
      data: player.cards,
    });
  }

  useCards(gameId: string, playerId: string) {
    const game = this.getGameById(gameId);
    this.checkIfPlayerIsInTheGame(gameId, playerId);
    this.checkIfItsPlayersTurn(game.currentPlayer.id, playerId);
    const player = this.getPlayerData(gameId, playerId);
    const results = getArmyFromCards(player.cards || [], game.setsOfCardsUsed);
    if (results) {
      const { cards, army } = results;
      player.cards = cards;
      game.armiesFromCards = army;
      game.armiesThisTurn += army;
      game.setsOfCardsUsed++;
    }
    this.eventLogger.saveGameLogs({
      gameId,
      event: EventType.USE_CARD,
      data: results,
    });
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
    this.eventLogger.saveGameLogs({
      gameId,
      event: EventType.SURRENDER,
      data: game.players,
    });
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
          this.eventLogger.saveGameLogs({
            gameId,
            event: EventType.ELIMINATE_PLAYER,
            data: player,
          });
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
    this.eventLogger.saveGameLogs({
      gameId,
      event: EventType.GENERATE_ARMIES,
      data: {
        armiesFromZones,
        armiesFromContinents,
        armiesThisTurn: game.armiesThisTurn,
      },
    });
    return armiesThisTurn;
  }
}
