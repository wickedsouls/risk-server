import { Test, TestingModule } from '@nestjs/testing';
import { GameService } from '../game.service';
import { ChatService } from '../../chat/chat.service';
import { Game, GameCard, GameStatus, PlayerStatus, TurnState } from '../types';
import { gameStub, playerStub } from '../../../test/stubs/game.stub';
import { GameErrors } from '../../common/errors';
import { Earth } from '../maps';
import { values } from 'lodash';
import {
  createTestingGame,
  getPlayerZones,
  getOtherPlayerZones,
} from '../utils';

describe('GameService', () => {
  let gameService: GameService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GameService, ChatService],
    }).compile();

    gameService = module.get<GameService>(GameService);
  });

  it('should be defined', () => {
    expect(gameService).toBeDefined();
  });

  // describe('Gameplay', () => {
  //   it('should assign colors', async () => {
  //     const { game } = await startFreshGameWithPlayers(6);
  //     service.assignPlayerColors(game);
  //     expect(game.players[0].color).toBeDefined();
  //   });
  //   it('should distribute lands', async () => {
  //     const { game, players } = await startFreshGameWithPlayers(6);
  //     const [player0] = players;
  //     service.loadMap(game, Earth);
  //     service.distributeLands(game);
  //     const zoneCount = service.getZoneCount(game);
  //     const playerZones0 = values(game.map.zones).filter(
  //       (zone) => zone.owner === player0.id,
  //     );
  //     expect(playerZones0.length).toBe(zoneCount / players.length);
  //   });
  //   it('should load map', async () => {
  //     const { game } = await startFreshGameWithPlayers(2);
  //     service.loadMap(game, Earth);
  //     expect(game.map).toBeDefined();
  //     expect(game.map.name).toBe('Earth');
  //   });
  //   it('should check if its a players turn', async () => {
  //     const { game } = await startFreshGameWithPlayers(6);
  //     service.initGame(game.gameId, Earth);
  //     expect(() => {
  //       service.checkIfItsPlayersTurn(
  //         game.currentPlayer.id,
  //         game.currentPlayer.id,
  //       );
  //     }).not.toThrow();
  //     expect(() => {
  //       service.checkIfItsPlayersTurn(game.currentPlayer.id, 'other id');
  //     }).toThrow(GameErrors.UNAUTHORIZED);
  //   });
  //   it('should check if player owns the zone', async () => {
  //     const { game } = await startFreshGameWithPlayers(6);
  //     service.initGame(game.gameId, Earth);
  //     const [playerZones] = getPlayerZones(game.currentPlayer.id, game);
  //     const [otherZones] = getOtherPlayerZones(game.currentPlayer.id, game);
  //     expect(() => {
  //       service.checkIfPlayerOwnsTheZone(
  //         game.currentPlayer.id,
  //         game,
  //         playerZones.name,
  //       );
  //     }).not.toThrow();
  //     expect(() => {
  //       service.checkIfPlayerOwnsTheZone(
  //         game.currentPlayer.id,
  //         game,
  //         otherZones.name,
  //       );
  //     }).toThrow(GameErrors.UNAUTHORIZED);
  //   });
  //   it('should check if zone has valid neighbours', async () => {
  //     const { game } = await startFreshGameWithPlayers(6);
  //     service.initGame(game.gameId, Earth);
  //     const zone = game.map.zones['Argentina'];
  //     expect(() => {
  //       service.checkIfZoneHasValidNeighbour(zone, 'Peru');
  //     }).not.toThrow();
  //     expect(() => {
  //       service.checkIfZoneHasValidNeighbour(zone, 'China');
  //     }).toThrow(GameErrors.BAD_REQUEST);
  //   });
  //   it('should generate army', async () => {
  //     const { game, players } = await startFreshGameWithPlayers(6);
  //     service.initGame(game.gameId, Earth);
  //     const playerId = players[0].id;
  //     // Armies from zones: 14
  //     for (const zone in game.map.zones) {
  //       game.map.zones[zone].owner = playerId;
  //     }
  //     // Armies from continents: 24
  //     for (const continent in game.map.continents) {
  //       game.map.continents[continent].owner = playerId;
  //     }
  //     const army = service.generateArmy(game.gameId);
  //     expect(army).toBe(14 + 24);
  //   });
  //   it('should end turn', async () => {
  //     const { game } = await startFreshGameWithPlayers(6);
  //     service.initGame(game.gameId, Earth);
  //     service.endTurn(game.gameId, game.players[0].id);
  //     expect(game.turnState).toBe(TurnState.PlaceArmies);
  //     expect(game.currentPlayer.id).toBe(game.players[1].id);
  //   });
  //   it('should throw if wrong player ends turn', async () => {
  //     const { game } = await startFreshGameWithPlayers(6);
  //     service.initGame(game.gameId, Earth);
  //     expect(() => service.endTurn(game.gameId, game.players[1].id)).toThrow(
  //       GameErrors.UNAUTHORIZED,
  //     );
  //   });
  //   describe('Place armies', () => {
  //     it('should place armies', async () => {
  //       const { game } = await startFreshGameWithPlayers(6);
  //       service.initGame(game.gameId, Earth);
  //       service.generateArmy(game.gameId);
  //       const [playerZone] = getPlayerZones(game.currentPlayer.id, game);
  //       service.placeArmies(
  //         game.gameId,
  //         game.currentPlayer.id,
  //         3,
  //         playerZone.name,
  //       );
  //       expect(playerZone.armies).toBe(3);
  //     });
  //     it('should throw if amount is invalid', async () => {
  //       const { game } = await startFreshGameWithPlayers(6);
  //       service.initGame(game.gameId, Earth);
  //       service.generateArmy(game.gameId);
  //       expect(() => {
  //         service.placeArmies(
  //           game.gameId,
  //           game.currentPlayer.id,
  //           99,
  //           Earth.zones['Argentina'].name,
  //         );
  //       }).toThrow(GameErrors.UNAUTHORIZED);
  //     });
  //     it('should throw if its not your turn', async () => {
  //       const { game } = await startFreshGameWithPlayers(6);
  //       service.initGame(game.gameId, Earth);
  //       service.generateArmy(game.gameId);
  //       expect(() => {
  //         service.placeArmies(
  //           game.gameId,
  //           'other id',
  //           3,
  //           Earth.zones['Argentina'].name,
  //         );
  //       }).toThrow(GameErrors.UNAUTHORIZED);
  //     });
  //     it('should throw if zone does not belong', async () => {
  //       const { game } = await startFreshGameWithPlayers(6);
  //       service.initGame(game.gameId, Earth);
  //       service.generateArmy(game.gameId);
  //       const [otherZone] = getOtherPlayerZones(game.currentPlayer.id, game);
  //       expect(() => {
  //         service.placeArmies(
  //           game.gameId,
  //           game.currentPlayer.id,
  //           3,
  //           otherZone.name,
  //         );
  //       }).toThrow(GameErrors.UNAUTHORIZED);
  //     });
  //   });
  // });
  // describe('Attack', () => {
  //   it('should attack and lose', async () => {
  //     const { game, players } = await startFreshGameWithPlayers(2);
  //     service.initGame(game.gameId, Earth);
  //     const { currentPlayer, gameId } = game;
  //     const nextPlayer = players[1];
  //     service.generateArmy(gameId);
  //     const attackerZone = game.map.zones['Argentina'];
  //     const defenderZone = game.map.zones['Brazil'];
  //     attackerZone.armies = 10;
  //     attackerZone.owner = currentPlayer.id;
  //     defenderZone.armies = 5;
  //     defenderZone.owner = nextPlayer.id;
  //     service.attack(
  //       gameId,
  //       currentPlayer.id,
  //       1,
  //       attackerZone.name,
  //       defenderZone.name,
  //     );
  //     expect(attackerZone.armies).toBe(9);
  //     expect(defenderZone.armies).toBe(4);
  //
  //     attackerZone.armies = 6;
  //     defenderZone.armies = 5;
  //     service.attack(
  //       gameId,
  //       currentPlayer.id,
  //       5,
  //       attackerZone.name,
  //       defenderZone.name,
  //     );
  //
  //     expect(attackerZone.armies).toBe(1);
  //     expect(defenderZone.armies).toBe(1);
  //     expect(defenderZone.owner).toBe(nextPlayer.id);
  //   });
  //   it('should attack and win', async () => {
  //     const { game, players } = await startFreshGameWithPlayers(2);
  //     service.initGame(game.gameId, Earth);
  //     const { currentPlayer, gameId } = game;
  //     const nextPlayer = players[1];
  //     service.generateArmy(gameId);
  //     const attackerZone = game.map.zones['Argentina'];
  //     const defenderZone = game.map.zones['Brazil'];
  //     attackerZone.armies = 10;
  //     attackerZone.owner = currentPlayer.id;
  //     defenderZone.armies = 5;
  //     defenderZone.owner = nextPlayer.id;
  //     service.attack(
  //       gameId,
  //       currentPlayer.id,
  //       6,
  //       attackerZone.name,
  //       defenderZone.name,
  //     );
  //     expect(attackerZone.armies).toBe(4);
  //     expect(defenderZone.armies).toBe(1);
  //     expect(defenderZone.owner).toBe(currentPlayer.id);
  //
  //     defenderZone.owner = nextPlayer.id;
  //     attackerZone.armies = 10;
  //     defenderZone.armies = 5;
  //     service.attack(
  //       gameId,
  //       currentPlayer.id,
  //       9,
  //       attackerZone.name,
  //       defenderZone.name,
  //     );
  //     expect(attackerZone.armies).toBe(1);
  //     expect(defenderZone.armies).toBe(4);
  //     expect(defenderZone.owner).toBe(currentPlayer.id);
  //   });
  //   it('should validate attack', async () => {
  //     const { game, players } = await startFreshGameWithPlayers(2);
  //     service.initGame(game.gameId, Earth);
  //     game.armiesThisTurn = 0;
  //     game.turnState = TurnState.Attack;
  //     const { currentPlayer, gameId } = game;
  //     const nextPlayer = players[1];
  //     service.generateArmy(gameId);
  //     const attackerZone = game.map.zones['Argentina'];
  //     const defenderZone = game.map.zones['Brazil'];
  //     const remoteZone = game.map.zones['China'];
  //
  //     attackerZone.armies = 10;
  //     attackerZone.owner = currentPlayer.id;
  //     defenderZone.armies = 5;
  //     defenderZone.owner = nextPlayer.id;
  //     remoteZone.owner = nextPlayer.id;
  //
  //     // Player uses all of his army and has none left at home base
  //     expect(() => {
  //       service.attack(
  //         gameId,
  //         currentPlayer.id,
  //         10,
  //         attackerZone.name,
  //         defenderZone.name,
  //       );
  //     }).toThrow(GameErrors.PLACE_ALL_ARMIES);
  //     // Player attacks his own zone
  //     expect(() => {
  //       service.attack(
  //         gameId,
  //         currentPlayer.id,
  //         4,
  //         attackerZone.name,
  //         attackerZone.name,
  //       );
  //     }).toThrow(GameErrors.BAD_REQUEST);
  //     // Player attacks not a neighbour zone
  //     expect(() => {
  //       service.attack(
  //         gameId,
  //         currentPlayer.id,
  //         4,
  //         attackerZone.name,
  //         remoteZone.name,
  //       );
  //     }).toThrow(GameErrors.BAD_REQUEST);
  //     // Player attacks when it's not his turn
  //     expect(() => {
  //       service.attack(
  //         gameId,
  //         nextPlayer.id,
  //         2,
  //         defenderZone.name,
  //         attackerZone.name,
  //       );
  //     }).toThrow(GameErrors.UNAUTHORIZED);
  //     // Player does not have that amount of army
  //     expect(() => {
  //       service.attack(
  //         gameId,
  //         currentPlayer.id,
  //         99,
  //         attackerZone.name,
  //         defenderZone.name,
  //       );
  //     }).toThrow(GameErrors.BAD_REQUEST);
  //   });
  //   it('should eliminate player', async () => {
  //     const { game, players } = await startFreshGameWithPlayers(6);
  //     const attackerId = players[0].id;
  //     const defenderId = players[1].id;
  //     service.initGame(game.gameId, Earth);
  //     for (const zone in game.map.zones) {
  //       game.map.zones[zone].owner = attackerId;
  //     }
  //     service.eliminatePlayer(game.gameId, attackerId, defenderId);
  //     expect(players[1].status).toBe(PlayerStatus.Defeat);
  //   });
  // });
  //
  // describe('Game card', () => {
  //   it('should get a card', async () => {
  //     const { game, players } = await startFreshGameWithPlayers(6);
  //     service.addCard(game.gameId, players[0].id);
  //     expect(game.players[0].cards.length).toBe(1);
  //     console.log(game.players[0].cards, 'cards');
  //     const cards = [
  //       GameCard.King,
  //       GameCard.Jack,
  //       GameCard.Queen,
  //       GameCard.Ace,
  //     ];
  //     expect(game.gameCards.length).toBe(43);
  //     expect(cards).toContain(game.players[0].cards[0]);
  //   });
  //   it('should use game card', async () => {
  //     const { game } = await startFreshGameWithPlayers(6);
  //     game.players[0].cards = [GameCard.Jack, GameCard.Jack, GameCard.Jack];
  //     game.armiesThisTurn = 10;
  //     service.useCards(game.gameId, game.players[0].id);
  //     expect(game.armiesFromCards).toBe(4);
  //     expect(game.armiesThisTurn).toBe(14);
  //     expect(game.players[0].cards.length).toBe(0);
  //     expect(game.setsOfCardsUsed).toBe(1);
  //     game.players[0].cards = [GameCard.Jack, GameCard.Jack, GameCard.Ace];
  //     service.useCards(game.gameId, game.players[0].id);
  //     expect(game.armiesFromCards).toBe(6);
  //     expect(game.armiesThisTurn).toBe(20);
  //     expect(game.setsOfCardsUsed).toBe(2);
  //     game.players[0].cards = [
  //       GameCard.Jack,
  //       GameCard.Queen,
  //       GameCard.Jack,
  //       GameCard.King,
  //     ];
  //     service.useCards(game.gameId, game.players[0].id);
  //     expect(game.armiesFromCards).toBe(8);
  //     expect(game.armiesThisTurn).toBe(28);
  //     expect(game.setsOfCardsUsed).toBe(3);
  //     expect(game.players[0].cards.length).toBe(1);
  //   });
  // });
  // describe('Attack continent', () => {
  //   it('should win continent', async () => {
  //     const { game, players } = await startFreshGameWithPlayers(2);
  //     service.initGame(game.gameId, Earth);
  //     game.map.continents['South America'].reward = 11;
  //     game.map.zones['Argentina'].owner = players[0].id;
  //     game.map.zones['Peru'].owner = players[0].id;
  //     game.map.zones['Brazil'].owner = players[0].id;
  //     game.map.zones['Venezuela'].owner = players[0].id;
  //     const winContinent = service['winContinent'](
  //       game.gameId,
  //       players[0].id,
  //       'Argentina',
  //     );
  //     expect(winContinent).toBeTruthy();
  //     expect(game.map.continents['South America'].owner).toBe(players[0].id);
  //   });
  //   it('should not win continent when not all lands are taken', async () => {
  //     const { game, players } = await startFreshGameWithPlayers(2);
  //     service.initGame(game.gameId, Earth);
  //     game.map.zones['Argentina'].owner = players[0].id;
  //     game.map.zones['Peru'].owner = players[1].id;
  //     const winContinent = service['winContinent'](
  //       game.gameId,
  //       players[0].id,
  //       'Argentina',
  //     );
  //     expect(winContinent).toBeFalsy();
  //     expect(game.map.continents['South America'].owner).toBeUndefined();
  //   });
  //   it('should lose the continent', async () => {
  //     const { game } = await startFreshGameWithPlayers(2);
  //     service.initGame(game.gameId, Earth);
  //     game.map.continents['South America'].owner = '1';
  //     service['loseContinent'](game.gameId, 'Argentina');
  //     expect(game.map.continents['South America'].owner).toBeUndefined();
  //   });
  // });
  // describe('End game', () => {
  //   it('should win the game', async () => {
  //     const { game, players } = await startFreshGameWithPlayers(3);
  //     service.initGame(game.gameId, Earth);
  //     players[1].status = PlayerStatus.Defeat;
  //     players[2].status = PlayerStatus.Defeat;
  //     service.checkForWin(game.gameId);
  //     expect(players[0].status).toBe(PlayerStatus.Win);
  //   });
  //   it('should surrender', async () => {
  //     const { game } = await startFreshGameWithPlayers(3);
  //     service.initGame(game.gameId, Earth);
  //     service.surrender(game.gameId, game.players[0].id);
  //     expect(game.players[0].status).toBe(PlayerStatus.Surrender);
  //   });
  // });
});
