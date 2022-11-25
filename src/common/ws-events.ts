import { Game, Message } from '../game/types';
import { CreateGameDto } from '../gateways/dtos/create-game.dto';

export interface GameError {
  error: boolean;
  message: string;
}

export interface ServerToClientEvents {
  // Registration / Preparation
  'set/GAMES': (payload: { [key: string]: Game }) => void;
  'set/CREATE_GAME': (payload: { [key: string]: Game }) => void;
  'set/JOIN_GAME': (payload: Game) => void;
  'set/START_GAME': (payload: { gameId: string }) => void;
  'set/LEAVE_GAME': (payload: Game) => void;
  'set/MESSAGES': (payload: Message) => void;
  'set/CANCEL_GAME': (payload: { gameId: string }) => void;
  // Gameplay
  'set/UPDATE_GAME': (payload: Game) => void;
  'set/SELECT_ZONE_FROM': (payload: { zone?: string }) => void;
  'set/SELECT_ZONE_TO': (payload: { zone?: string }) => void;
  'set/SELECT_ZONE': (payload: { zone?: string }) => void;
}

export interface ClientToServerEvents {
  // Registration / Preparation
  'request/GET_ALL_GAMES': (
    payload: null,
    ack: (data: { [key: string]: Game }) => void,
  ) => void;
  'request/GET_GAME_INFO': (
    payload: { gameId: string },
    ack: (data: { game: Game; chat: Message[] } | GameError) => void,
  ) => void;
  'request/CREATE_GAME': (
    payload: CreateGameDto,
    ack: (data: Game | GameError) => void,
  ) => void;
  'request/JOIN_GAME': (
    payload: { gameId: string; password?: string },
    ack: (data: { game: Game; chat: Message[] } | GameError) => void,
  ) => void;
  'request/START_GAME': (
    payload: { gameId: string },
    ack: (data: Game | GameError) => void,
  ) => void;
  'request/LEAVE_GAME': (payload: { gameId: string }) => void;
  'request/SEND_MESSAGE': (payload: { message: string }) => void;
  'request/CANCEL_GAME': (payload: { gameId: string }) => void;
  // Gameplay
  'request/END_TURN': (
    payload: { gameId: string },
    ack: (data: Game | GameError) => void,
  ) => void;
  'request/PLACE_ARMIES': (payload: {
    gameId: string;
    zone: string;
    amount: number;
  }) => void;
  'request/ATTACK_PLAYER': (
    payload: { zoneFrom: string; zoneTo: string; amount: number },
    ack: (data: GameError) => void,
  ) => void;
  'request/MOVE_ARMY': (
    payload: { zoneFrom: string; zoneTo: string; amount: number },
    ack: (data: GameError) => void,
  ) => void;
  'request/SELECT_ZONE_FROM': (payload: { zone?: string }) => void;
  'request/SELECT_ZONE_TO': (payload: { zone?: string }) => void;
  'request/USE_CARDS': () => void;
  'request/SURRENDER': () => void;
  'request/FINISH_ATTACK': () => void;
}
