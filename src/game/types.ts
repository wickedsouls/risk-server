import { Socket } from 'socket.io';

import {
  ClientToServerEvents,
  ServerToClientEvents,
} from '../common/ws-events';

export interface CreateGameData {
  isPrivate?: boolean;
  password?: string;
  minPlayers: number;
  maxPlayers: number;
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

export interface Player {
  id: string;
  username: string;
  color?: string;
  status?: 'win' | 'defeat' | 'deserter';
  title?: string;
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

  currentPlayer?: Player;
  currentPlayerIndex?: number;
  map?: Map<string, string>;
  armiesThisTurn?: number;
  turnState?: TurnState;
}

export interface Map<Z, C> {
  name: string;
  zones: {
    [key: string]: Zone<Z, C>;
  };
  continents: {
    [key: string]: Continent<C>;
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

export interface Continent<C> {
  name: C;
  reward: number;
  owner?: string;
  zoneCount: number;
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