import { Game, Message } from '../game/types';
import { CreateGameDto } from '../gateways/dtos/create-game.dto';

export interface GameError {
  error: boolean;
  message: string;
}

export interface ServerToClientEvents {
  'set/GAMES': (payload: { [key: string]: Game }) => void;
  'set/CREATE_GAME': (payload: { [key: string]: Game }) => void;
  'set/JOIN_GAME': (payload: Game) => void;
  'set/START_GAME': (payload: Game) => void;
  'set/LEAVE_GAME': (payload: Game) => void;
  'set/MESSAGES': (payload: Message) => void;
}

export interface ClientToServerEvents {
  'request/GET_ALL_GAMES': (
    payload: null,
    ack: (data: { [key: string]: Game }) => void,
  ) => void;
  'request/CREATE_GAME': (
    payload: CreateGameDto,
    ack: (data: Game | GameError) => void,
  ) => void;
  'request/JOIN_GAME': (
    payload: { gameId: string },
    ack: (data: { game: Game; chat: Message[] } | GameError) => void,
  ) => void;
  'request/START_GAME': (
    payload: Game,
    ack: (data: Game | GameError) => void,
  ) => void;
  'request/LEAVE_GAME': (payload: { gameId: string }) => void;
  'request/SEND_MESSAGE': (payload: { message: string }) => void;
}
