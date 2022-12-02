import { Socket } from 'socket.io';

import {
  ClientToServerEvents,
  ServerToClientEvents,
} from '../common/ws-events';

export enum GameCard {
  'Jack' = 'Joker',
  'Queen' = 'Queen',
  'King' = 'King',
  'Ace' = 'Ace',
}

export enum GameStatus {
  'Registering' = 'Registering',
  'InProgress' = 'InProgress',
  'Completed' = 'Completed',
  'Canceled' = 'Canceled',
}

export enum TurnState {
  'Prepare' = 'Prepare',
  'PlaceArmies' = 'Place-Armies',
  'Attack' = 'Attack',
  'Move' = 'Move',
}

export enum PlayerStatus {
  Win = 'Win',
  Defeat = 'Defeat',
  Deserter = 'Deserter',
  Surrender = 'Surrender',
  InGame = 'InGame',
}

export interface Player {
  id: string;
  username: string;
  color?: string;
  status?: PlayerStatus;
  title?: string;
  isBot?: boolean;
  botLevel?: number;
  cards?: GameCard[];
}

export interface Game {
  createdBy?: Player;
  createdAt: Date;
  players: Player[];
  gameId: string;
  gameStatus: GameStatus;
  password?: string;
  isPrivate?: boolean;
  maxPlayers: number;
  minPlayers: number;
  winner?: Player;
  setsOfCardsUsed: number;
  timeout: number;
  usePrecision?: boolean;
  disableLogger?: boolean;

  currentPlayer?: Player;
  currentPlayerIndex?: number;
  map?: Map<string, string>;
  armiesThisTurn?: number;
  armiesFromCards?: number;
  turnState?: TurnState;
  gameCards?: GameCard[];
}

export interface Map<Z, C> {
  name: string;
  zones: {
    [key: string]: Zone<Z, C>;
  };
  continents: {
    [key: string]: Continent<C, Z>;
  };
}

export interface Zone<Z, C> {
  name: Z;
  owner?: string;
  reward: number;
  armies?: number;
  neighbours: Z[];
  continent: C;
}

export interface Continent<C, Z> {
  name: C;
  reward: number;
  owner?: string;
  zoneCount: number;
  entryPoints: Z[];
}

export type ClientSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  unknown,
  { user: Player }
>;

export interface Message {
  createdAt: Date;
  player: Player;
  message: string;
}

export interface CreateGameDto {
  isPrivate?: boolean;
  password?: string;
  minPlayers: number;
  maxPlayers: number;
  map: Map<any, any>;
}

export interface StartGameOptions {
  usePrecision?: boolean;
  endTurn?: () => void;
  shuffleColors?: boolean;
  shufflePlayers?: boolean;
}
