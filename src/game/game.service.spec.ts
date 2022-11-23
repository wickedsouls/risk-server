import { Test, TestingModule } from '@nestjs/testing';
import { GameService } from './game.service';
import { Game, GameStatus, Player, TurnState } from './types';
import { gameStub, playerStub } from '../../test/stubs/game.stub';
import { GameErrors } from '../common/errors';
import { Earth } from './maps';
import { values, cloneDeep } from 'lodash';

describe('GameService', () => {
  let service: GameService;

  const startFreshGameWithPlayers = async (
    playerCount: number,
  ): Promise<{ game: Game; players: Player[] }> => {
    const game = await service.createGame(gameStub(), playerStub());
    const players = [];
    for (let i = 0; i < playerCount; i++) {
      players.push(cloneDeep(playerStub({ id: i + '', username: i + '' })));
    }
    players.forEach(async (player) => {
      await service.joinTheGame(game.gameId, player);
    });
    service.startGame(game.gameId, game.createdBy.id);
    return {
      game,
      players,
    };
  };

  const getPlayerZones = (playerId: string, game: Game) => {
    return values(game.map.zones).filter((zone) => {
      return zone.owner === game.currentPlayer.id;
    });
  };
  const getOtherPlayerZones = (playerId: string, game: Game) => {
    return values(game.map.zones).filter((zone) => {
      return zone.owner !== game.currentPlayer.id;
    });
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GameService],
    }).compile();

    service = module.get<GameService>(GameService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Create game', () => {
    it('should create public game', async () => {
      const game = await service.createGame(gameStub(), playerStub());
      expect(game).toBeDefined();
      expect(game.gameId).toBeDefined();
      expect(game.gameStatus).toBe(GameStatus.Registering);
      expect(service);
      expect(game.isPrivate).toBeFalsy();
      expect(game.minPlayers).toBe(2);
      expect(game.maxPlayers).toBe(6);
      expect(game.createdBy).toMatchObject(playerStub());
    });
    it('should create private game', async () => {
      const game = await service.createGame(
        gameStub({ isPrivate: true, password: 'secret' }),
        playerStub(),
      );
      expect(game.isPrivate).toBeTruthy();
      expect(game.password).not.toBe('secret');
    });
    it('should throw if game is private without password', async () => {
      await expect(async () => {
        await service.createGame(
          gameStub({ isPrivate: true, password: undefined, minPlayers: 1 }),
          playerStub(),
        );
      }).rejects.toThrow(GameErrors.PASSWORD_IS_REQUIRED);
    });
    it('should throw if player has already created a game', () => {
      // Implement later
    });
  });

  describe('Get games', () => {
    it('should return all games', async () => {
      await service.createGame(gameStub(), playerStub());
      const games = service.getAllGames();
      expect(Object.keys(games).length).toBe(1);
      const gameId = Object.keys(games)[0];
      expect(games[gameId].createdAt).toBeDefined();
    });
  });

  describe('Game preparation', () => {
    it('should join game', async () => {
      const { gameId } = await service.createGame(gameStub(), playerStub());
      service.joinTheGame(gameId, playerStub());
      const game = service.games[gameId];
      expect(game.players.length).toBe(1);
      expect(game.players).toMatchObject([playerStub()]);
    });
    it('should throw error if game is not found', async () => {
      await expect(async () => {
        await service.joinTheGame('123', playerStub());
      }).rejects.toThrow(GameErrors.GAME_NOT_FOUND);
    });
    it('should throw error if game is full', async () => {
      const { gameId } = await service.createGame(
        gameStub({ maxPlayers: 2 }),
        playerStub(),
      );
      await service.joinTheGame(gameId, playerStub());
      await service.joinTheGame(gameId, playerStub({ id: '2', username: '2' }));
      await expect(
        async () =>
          await service.joinTheGame(
            gameId,
            playerStub({ id: '3', username: '3' }),
          ),
      ).rejects.toThrow(GameErrors.GAME_IS_FULL);
    });
    it('should not join if player is already registered', async () => {
      const { gameId, players } = await service.createGame(
        gameStub(),
        playerStub(),
      );
      await service.joinTheGame(gameId, playerStub());
      await service.joinTheGame(gameId, playerStub());
      expect(players.length).toBe(1);
    });
    it('should trow if no or bad password is provided', async () => {
      const { gameId } = await service.createGame(
        gameStub({ isPrivate: true, password: 'secret' }),
        playerStub(),
      );
      await expect(
        async () => await service.joinTheGame(gameId, playerStub(), 'wrong1'),
      ).rejects.toThrow();
    });
    it('should join private game with password', async () => {
      const { gameId } = await service.createGame(
        gameStub({ isPrivate: true, password: 'secret' }),
        playerStub(),
      );
      const game = await service.joinTheGame(gameId, playerStub(), 'secret');
      expect(game).toBeDefined();
    });
    it('should throw error if player joining on started game', async () => {
      // TODO, create this when start game is ready
    });
    it('player should be able to leave the game', async () => {
      const { gameId } = await service.createGame(gameStub(), playerStub());
      service.joinTheGame(gameId, playerStub());
      service.joinTheGame(gameId, playerStub({ id: '2', username: '2' }));
      service.leaveTheGame(gameId, playerStub().id);
      expect(service.games[gameId].players.length).toBe(1);
    });
    it('should delete the game if all players leave', async () => {
      const { gameId } = await service.createGame(gameStub(), playerStub());
      await service.joinTheGame(gameId, playerStub());
      service.leaveTheGame(gameId, playerStub().id);
      expect(service.games[gameId]).toBeUndefined();
    });
    it('should cancel the game', async () => {
      const { gameId } = await service.createGame(gameStub(), playerStub());
      service.cancelGame(gameId, playerStub().id);
      expect(service.games[gameId]).toBeUndefined();
    });
    it('should throw if not creator cancels it', async () => {
      const { gameId } = await service.createGame(gameStub(), playerStub());
      expect(() => {
        service.cancelGame(gameId, 'other');
      }).toThrow(GameErrors.UNAUTHORIZED);
    });
    it('should throw if game is in progress', async () => {
      const { gameId } = await service.createGame(
        gameStub({ minPlayers: 1 }),
        playerStub(),
      );
      await service.joinTheGame(gameId, playerStub());
      await service.startGame(gameId, playerStub().id);
      expect(() => {
        service.cancelGame(gameId, playerStub().id);
      }).toThrow(GameErrors.GAME_HAS_STARTED);
    });
    it('should start game', async () => {
      const { gameId } = await service.createGame(
        gameStub({ minPlayers: 1 }),
        playerStub(),
      );
      service.joinTheGame(gameId, playerStub());
      const { gameStatus } = service.startGame(gameId, playerStub().id);
      expect(gameStatus).toBe(GameStatus.InProgress);
    });
    it('should fail to start if not the owner starts it', async () => {
      const { gameId } = await service.createGame(
        gameStub({ minPlayers: 1 }),
        playerStub(),
      );
      service.joinTheGame(gameId, playerStub());
      expect(() => {
        service.startGame(gameId, 'other');
      }).toThrow(GameErrors.UNAUTHORIZED);
    });
    it('should fail to start if game status is not registering', async () => {
      const { gameId } = await service.createGame(
        gameStub({ minPlayers: 1 }),
        playerStub(),
      );
      service.joinTheGame(gameId, playerStub());
      expect(() => {
        service.startGame(gameId, playerStub().id);
        service.startGame(gameId, playerStub().id);
      }).toThrow(GameErrors.BAD_REQUEST);
    });
    it('should fail to start with too few players', async () => {
      const { gameId } = await service.createGame(gameStub(), playerStub());
      expect(() => {
        service.startGame(gameId, playerStub().id);
      }).toThrow(GameErrors.BAD_REQUEST);
    });
    it('should get started game info', async () => {
      const { gameId } = await service.createGame(
        gameStub({ minPlayers: 1 }),
        playerStub(),
      );
      await service.joinTheGame(gameId, playerStub());
      await service.startGame(gameId, playerStub().id);
      const game = await service.getGameInfo(gameId, playerStub().id);
      expect(game).toBeDefined();
    });
    it('should throw on private game on unknown player', async () => {
      const { gameId } = await service.createGame(
        gameStub({ minPlayers: 1, isPrivate: true, password: '123' }),
        playerStub(),
      );
      await service.joinTheGame(gameId, playerStub(), '123');
      await service.startGame(gameId, playerStub().id);
      expect(() => {
        service.getGameInfo(gameId, 'otherId');
      }).toThrow(GameErrors.UNAUTHORIZED);
    });
    it('should get started private game info', async () => {
      // TODO: finish private game
      const { gameId, players } = await service.createGame(
        gameStub({ minPlayers: 1, isPrivate: true, password: '123' }),
        playerStub(),
      );
      await service.joinTheGame(gameId, playerStub(), '123');
      await service.startGame(gameId, playerStub().id);
      const game = await service.getGameInfo(gameId, playerStub().id);
      expect(game).toBeDefined();
    });
  });
  describe('Gameplay', () => {
    it('should assign colors', async () => {
      const { game } = await startFreshGameWithPlayers(6);
      service.assignPlayerColors(game);
      expect(game.players[0].color).toBeDefined();
    });
    it('should distribute lands', async () => {
      const { game, players } = await startFreshGameWithPlayers(6);
      const [player0] = players;
      service.loadMap(game, Earth);
      service.distributeLands(game);
      const zoneCount = service.getZoneCount(game);
      const playerZones0 = values(game.map.zones).filter(
        (zone) => zone.owner === player0.id,
      );
      expect(playerZones0.length).toBe(zoneCount / players.length);
    });
    it('should load map', async () => {
      const { game } = await startFreshGameWithPlayers(2);
      service.loadMap(game, Earth);
      expect(game.map).toBeDefined();
      expect(game.map.name).toBe('Earth');
    });
    it('should check if its a players turn', async () => {
      const { game } = await startFreshGameWithPlayers(6);
      service.initGame(game.gameId, Earth);
      expect(() => {
        service.checkIfItsPlayersTurn(
          game.currentPlayer.id,
          game.currentPlayer.id,
        );
      }).not.toThrow();
      expect(() => {
        service.checkIfItsPlayersTurn(game.currentPlayer.id, 'other id');
      }).toThrow(GameErrors.UNAUTHORIZED);
    });
    it('should check if player owns the zone', async () => {
      const { game } = await startFreshGameWithPlayers(6);
      service.initGame(game.gameId, Earth);
      const [playerZones] = getPlayerZones(game.currentPlayer.id, game);
      const [otherZones] = getOtherPlayerZones(game.currentPlayer.id, game);
      expect(() => {
        service.checkIfPlayerOwnsTheZone(
          game.currentPlayer.id,
          game,
          playerZones.name,
        );
      }).not.toThrow();
      expect(() => {
        service.checkIfPlayerOwnsTheZone(
          game.currentPlayer.id,
          game,
          otherZones.name,
        );
      }).toThrow(GameErrors.UNAUTHORIZED);
    });
    it('should check if zone has valid neighbours', async () => {
      const { game } = await startFreshGameWithPlayers(6);
      service.initGame(game.gameId, Earth);
      const zone = game.map.zones['Argentina'];
      expect(() => {
        service.checkIfZoneHasValidNeighbour(zone, 'Peru');
      }).not.toThrow();
      expect(() => {
        service.checkIfZoneHasValidNeighbour(zone, 'China');
      }).toThrow(GameErrors.BAD_REQUEST);
    });
    it('should generate army', async () => {
      const { game, players } = await startFreshGameWithPlayers(6);
      service.initGame(game.gameId, Earth);
      const playerId = players[0].id;
      // Armies from zones: 14
      for (const zone in game.map.zones) {
        game.map.zones[zone].owner = playerId;
      }
      // Armies from continents: 24
      for (const continent in game.map.continents) {
        game.map.continents[continent].owner = playerId;
      }
      const army = service.generateArmy(game.gameId);
      expect(army).toBe(14 + 24);
    });
    it('should end turn', async () => {
      const { game } = await startFreshGameWithPlayers(6);
      service.initGame(game.gameId, Earth);
      service.endTurn(game.gameId, game.players[0].id);
      expect(game.turnState).toBe(TurnState.PlaceArmies);
      expect(game.currentPlayer.id).toBe(game.players[1].id);
    });
    it('should throw if wrong player ends turn', async () => {
      const { game } = await startFreshGameWithPlayers(6);
      service.initGame(game.gameId, Earth);
      expect(() => service.endTurn(game.gameId, game.players[1].id)).toThrow(
        GameErrors.UNAUTHORIZED,
      );
    });
    describe('Place armies', () => {
      it('should place armies', async () => {
        const { game } = await startFreshGameWithPlayers(6);
        service.initGame(game.gameId, Earth);
        service.generateArmy(game.gameId);
        const [playerZone] = getPlayerZones(game.currentPlayer.id, game);
        service.placeArmies(
          game.gameId,
          game.currentPlayer.id,
          3,
          playerZone.name,
        );
        expect(playerZone.armies).toBe(3);
      });
      it('should throw if amount is invalid', async () => {
        const { game } = await startFreshGameWithPlayers(6);
        service.initGame(game.gameId, Earth);
        service.generateArmy(game.gameId);
        expect(() => {
          service.placeArmies(
            game.gameId,
            game.currentPlayer.id,
            99,
            Earth.zones['Argentina'].name,
          );
        }).toThrow(GameErrors.UNAUTHORIZED);
      });
      it('should throw if its not your turn', async () => {
        const { game } = await startFreshGameWithPlayers(6);
        service.initGame(game.gameId, Earth);
        service.generateArmy(game.gameId);
        expect(() => {
          service.placeArmies(
            game.gameId,
            'other id',
            3,
            Earth.zones['Argentina'].name,
          );
        }).toThrow(GameErrors.UNAUTHORIZED);
      });
      it('should throw if zone does not belong', async () => {
        const { game } = await startFreshGameWithPlayers(6);
        service.initGame(game.gameId, Earth);
        service.generateArmy(game.gameId);
        const [otherZone] = getOtherPlayerZones(game.currentPlayer.id, game);
        expect(() => {
          service.placeArmies(
            game.gameId,
            game.currentPlayer.id,
            3,
            otherZone.name,
          );
        }).toThrow(GameErrors.UNAUTHORIZED);
      });
    });
  });
  describe('Attack', () => {
    it('should attack and lose', async () => {
      const { game, players } = await startFreshGameWithPlayers(2);
      service.initGame(game.gameId, Earth);
      const { currentPlayer, gameId } = game;
      const nextPlayer = players[1];
      service.generateArmy(gameId);
      const attackerZone = game.map.zones['Argentina'];
      const defenderZone = game.map.zones['Brazil'];
      attackerZone.armies = 10;
      attackerZone.owner = currentPlayer.id;
      defenderZone.armies = 5;
      defenderZone.owner = nextPlayer.id;
      service.attack(
        gameId,
        currentPlayer.id,
        1,
        attackerZone.name,
        defenderZone.name,
      );
      expect(attackerZone.armies).toBe(9);
      expect(defenderZone.armies).toBe(4);

      attackerZone.armies = 6;
      defenderZone.armies = 5;
      service.attack(
        gameId,
        currentPlayer.id,
        5,
        attackerZone.name,
        defenderZone.name,
      );

      expect(attackerZone.armies).toBe(1);
      expect(defenderZone.armies).toBe(1);
      expect(defenderZone.owner).toBe(nextPlayer.id);
    });
    it('should attack and win', async () => {
      const { game, players } = await startFreshGameWithPlayers(2);
      service.initGame(game.gameId, Earth);
      const { currentPlayer, gameId } = game;
      const nextPlayer = players[1];
      service.generateArmy(gameId);
      const attackerZone = game.map.zones['Argentina'];
      const defenderZone = game.map.zones['Brazil'];
      attackerZone.armies = 10;
      attackerZone.owner = currentPlayer.id;
      defenderZone.armies = 5;
      defenderZone.owner = nextPlayer.id;
      service.attack(
        gameId,
        currentPlayer.id,
        6,
        attackerZone.name,
        defenderZone.name,
      );
      expect(attackerZone.armies).toBe(4);
      expect(defenderZone.armies).toBe(1);
      expect(defenderZone.owner).toBe(currentPlayer.id);

      defenderZone.owner = nextPlayer.id;
      attackerZone.armies = 10;
      defenderZone.armies = 5;
      service.attack(
        gameId,
        currentPlayer.id,
        9,
        attackerZone.name,
        defenderZone.name,
      );
      expect(attackerZone.armies).toBe(1);
      expect(defenderZone.armies).toBe(4);
      expect(defenderZone.owner).toBe(currentPlayer.id);
    });
    it('should validate attack', async () => {
      const { game, players } = await startFreshGameWithPlayers(2);
      service.initGame(game.gameId, Earth);
      game.armiesThisTurn = 0;
      game.turnState = TurnState.Attack;
      const { currentPlayer, gameId } = game;
      const nextPlayer = players[1];
      service.generateArmy(gameId);
      const attackerZone = game.map.zones['Argentina'];
      const defenderZone = game.map.zones['Brazil'];
      const remoteZone = game.map.zones['China'];

      attackerZone.armies = 10;
      attackerZone.owner = currentPlayer.id;
      defenderZone.armies = 5;
      defenderZone.owner = nextPlayer.id;
      remoteZone.owner = nextPlayer.id;

      // Player uses all of his army and has none left at home base
      expect(() => {
        service.attack(
          gameId,
          currentPlayer.id,
          10,
          attackerZone.name,
          defenderZone.name,
        );
      }).toThrow(GameErrors.PLACE_ALL_ARMIES);
      // Player attacks his own zone
      expect(() => {
        service.attack(
          gameId,
          currentPlayer.id,
          4,
          attackerZone.name,
          attackerZone.name,
        );
      }).toThrow(GameErrors.BAD_REQUEST);
      // Player attacks not a neighbour zone
      expect(() => {
        service.attack(
          gameId,
          currentPlayer.id,
          4,
          attackerZone.name,
          remoteZone.name,
        );
      }).toThrow(GameErrors.BAD_REQUEST);
      // Player attacks when it's not his turn
      expect(() => {
        service.attack(
          gameId,
          nextPlayer.id,
          2,
          defenderZone.name,
          attackerZone.name,
        );
      }).toThrow(GameErrors.UNAUTHORIZED);
      // Player does not have that amount of army
      expect(() => {
        service.attack(
          gameId,
          currentPlayer.id,
          99,
          attackerZone.name,
          defenderZone.name,
        );
      }).toThrow(GameErrors.BAD_REQUEST);
    });
    it('should eliminate player', async () => {
      const { game, players } = await startFreshGameWithPlayers(6);
      const attackerId = players[0].id;
      const defenderId = players[1].id;
      service.initGame(game.gameId, Earth);
      for (const zone in game.map.zones) {
        game.map.zones[zone].owner = attackerId;
      }
      service.eliminatePlayer(game.gameId, attackerId, defenderId);
      expect(players[1].status).toBe('defeat');
    });
  });
  describe('Attack continent', () => {
    it('should win continent', async () => {
      const { game, players } = await startFreshGameWithPlayers(2);
      service.initGame(game.gameId, Earth);
      game.map.continents['South America'].reward = 11;
      game.map.zones['Argentina'].owner = players[0].id;
      game.map.zones['Peru'].owner = players[0].id;
      game.map.zones['Brazil'].owner = players[0].id;
      game.map.zones['Venezuela'].owner = players[0].id;
      const winContinent = service['winContinent'](
        game.gameId,
        players[0].id,
        'Argentina',
      );
      expect(winContinent).toBeTruthy();
      expect(game.map.continents['South America'].owner).toBe(players[0].id);
    });
    it('should not win continent when not all lands are taken', async () => {
      const { game, players } = await startFreshGameWithPlayers(2);
      service.initGame(game.gameId, Earth);
      game.map.zones['Argentina'].owner = players[0].id;
      game.map.zones['Peru'].owner = players[1].id;
      const winContinent = service['winContinent'](
        game.gameId,
        players[0].id,
        'Argentina',
      );
      expect(winContinent).toBeFalsy();
      expect(game.map.continents['South America'].owner).toBeUndefined();
    });
    it('should lose the continent', async () => {
      const { game } = await startFreshGameWithPlayers(2);
      service.initGame(game.gameId, Earth);
      game.map.continents['South America'].owner = '1';
      service['loseContinent'](game.gameId, 'Argentina');
      expect(game.map.continents['South America'].owner).toBeUndefined();
    });
  });
  describe('End game', () => {
    it('should win the game', async () => {
      const { game, players } = await startFreshGameWithPlayers(3);
      service.initGame(game.gameId, Earth);
      players[1].status = 'defeat';
      players[2].status = 'defeat';
      service.checkForWin(game.gameId);
      expect(players[0].status).toBe('win');
    });
  });
});
