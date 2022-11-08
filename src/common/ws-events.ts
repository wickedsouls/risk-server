import { Game } from '../game/interface';

export interface ServerToClientEvents {
  'to-client/CREATE_GAME': (payload: { gameId: string }) => void;
  'to-client/RETURN_ALL_GAMES': (payload: { [key: string]: Game }) => void;
  'to-client/JOIN_GAME': (payload: { gameId: string }) => void;
  'to-client/START_GAME': (payload: { gameId: string }) => void;
}

export interface ClientToServerEvents {
  'to-server/GET_ALL_GAMES': (payload: { [key: string]: Game }) => void;
  'to-server/CREATE_GAME': () => void;
  'to-server/JOIN_GAME': () => void;
  'to-server/START_GAME': () => void;
}
