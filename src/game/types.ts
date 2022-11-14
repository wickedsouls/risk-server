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

export interface Player {
  id: string;
  username: string;
}

export interface Game {
  createdBy?: Player;
  createdAt: Date;
  players: Player[];
  currentPlayer: string;
  gameId: string;
  gameStatus: GameStatus;
  password?: string;
  isPrivate?: boolean;
  maxPlayers: number;
  minPlayers: number;
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
