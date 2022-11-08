import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  WsException,
  BaseWsExceptionFilter,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { GameService } from '../game/game.service';
import { CreateGameDto } from './dtos/create-game.dto';
import {
  ClientToServerEvents,
  ServerToClientEvents,
} from '../common/ws-events';
import { JoinGameDto } from './dtos/join-game.dto';
import { UseFilters, ValidationPipe } from '@nestjs/common';
import { BadRequestTransformationFilter } from '../filters/bad-request-transformation.filter';

@UseFilters(BadRequestTransformationFilter)
@WebSocketGateway({ namespace: '/game', cors: { origin: [] } })
export class GameGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server<ClientToServerEvents, ServerToClientEvents>;

  constructor(private gameService: GameService) {}

  handleConnection(socket: Socket) {
    console.log(`User ${socket.id} connected`);
  }

  @SubscribeMessage<keyof ClientToServerEvents>('to-server/START_GAME')
  startTheGame(
    @MessageBody() payload: { gameId: string },
    @ConnectedSocket() socket: Socket<ServerToClientEvents>,
  ) {
    const { gameId } = payload;
    this.gameService.startGame(gameId);
    this.server.to(gameId).emit('to-client/START_GAME', { gameId });
  }

  @SubscribeMessage<keyof ClientToServerEvents>('to-server/CREATE_GAME')
  async createGame(
    @ConnectedSocket() socket: Socket<ServerToClientEvents>,
    @MessageBody(new ValidationPipe()) data: CreateGameDto,
  ) {
    const { password, isPrivate } = data;
    const { gameId } = await this.gameService.createGame({
      password,
      isPrivate,
    });
    socket.emit('to-client/CREATE_GAME', { gameId });
  }

  @SubscribeMessage<keyof ClientToServerEvents>('to-server/JOIN_GAME')
  joinTheGame(
    @MessageBody(new ValidationPipe()) payload: JoinGameDto,
    @ConnectedSocket() socket: Socket<ServerToClientEvents>,
  ) {
    const { gameId } = payload;
    socket.join(gameId);
    this.gameService.joinTheGame(socket.id, gameId);
    socket.emit('to-client/JOIN_GAME', { gameId });
  }

  @SubscribeMessage<keyof ClientToServerEvents>('to-server/GET_ALL_GAMES')
  getAllGames(@ConnectedSocket() socket: Socket<ServerToClientEvents>) {
    const games = this.gameService.getAllGames();
    socket.emit('to-client/RETURN_ALL_GAMES', games);
  }
}
