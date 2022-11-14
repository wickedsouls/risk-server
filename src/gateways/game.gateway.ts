import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { GameService } from '../game/game.service';
import {
  ClientToServerEvents,
  ServerToClientEvents,
} from '../common/ws-events';
import { JoinGameDto } from './dtos/join-game.dto';
import { UseFilters, ValidationPipe } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { ClientSocket, CreateGameData } from '../game/types';
import { ChatService } from '../chat/chat.service';
import { GameErrors } from '../common/errors';
import { CatchGatewayErrors } from '../decorators/catch-gateway-errors';

@UseFilters()
@WebSocketGateway({
  namespace: '/game',
  cors: { origin: ['http://localhost:3000', 'http://192.168.1.154:3000'] },
})
export class GameGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server<ClientToServerEvents, ServerToClientEvents>;

  constructor(
    private authService: AuthService,
    private gameService: GameService,
    private chatService: ChatService,
  ) {}

  async handleConnection(socket: Socket) {
    const token = await socket.handshake.auth.token;
    const user = await this.authService.validateToken(token);
    if (user) {
      socket.data.user = { id: user.id, username: user.username };
    } else {
      // socket.data.user = { id: '01' };
      socket.disconnect(true);
    }
    return socket;
  }

  getUserData(socket: ClientSocket) {
    if (!socket.data?.user?.id) {
      throw new Error(GameErrors.MISSING_USER_PAYLOAD);
    }
    return {
      room: Array.from(socket.rooms)[1],
      userId: socket.data.user.id,
      user: socket.data.user,
    };
  }

  @SubscribeMessage<keyof ClientToServerEvents>('request/LEAVE_GAME')
  @CatchGatewayErrors()
  leaveTheGame(
    @MessageBody() payload: { gameId: string },
    @ConnectedSocket() socket: Socket,
  ) {
    const { gameId } = payload;
    const { userId } = this.getUserData(socket);
    const game = this.gameService.leaveTheGame(gameId, userId);
    socket.leave(gameId);
    this.server.to(gameId).emit('set/LEAVE_GAME', game);
    this.server.emit('set/GAMES', this.gameService.games);
  }

  @SubscribeMessage<keyof ClientToServerEvents>('request/START_GAME')
  @CatchGatewayErrors()
  startTheGame(
    @MessageBody() payload: { gameId: string },
    @ConnectedSocket() socket: Socket,
  ) {
    const { gameId } = payload;
    const { userId } = this.getUserData(socket);
    const game = this.gameService.startGame(gameId, userId);
    this.server.emit('set/GAMES', this.gameService.games);
    this.server.to(gameId).emit('set/START_GAME', game);
  }

  @SubscribeMessage<keyof ClientToServerEvents>('request/CREATE_GAME')
  @CatchGatewayErrors()
  async createGame(
    @MessageBody() data: CreateGameData,
    @ConnectedSocket() socket: Socket,
  ) {
    const { user } = this.getUserData(socket);
    const game = await this.gameService.createGame(data, user);
    this.chatService.createChatRoom(game.gameId);
    this.server.emit('set/GAMES', this.gameService.games);
    return game;
  }

  @SubscribeMessage<keyof ClientToServerEvents>('request/JOIN_GAME')
  @CatchGatewayErrors()
  async joinTheGame(
    @MessageBody(new ValidationPipe()) payload: JoinGameDto,
    @ConnectedSocket() socket: Socket<ServerToClientEvents>,
  ) {
    const { gameId } = payload;
    const { user } = this.getUserData(socket);
    const game = await this.gameService.joinTheGame(gameId, user);
    const chat = this.chatService.getMessagesForTheRoom(gameId);
    this.server.to(gameId).emit('set/JOIN_GAME', game);
    this.server.emit('set/GAMES', this.gameService.games);
    socket.join(gameId);
    return { game, chat };
  }

  @SubscribeMessage<keyof ClientToServerEvents>('request/GET_ALL_GAMES')
  getAllGames() {
    return this.gameService.getAllGames();
  }

  @SubscribeMessage<keyof ClientToServerEvents>('request/SEND_MESSAGE')
  receiveMessage(
    @MessageBody() data: { message: string },
    @ConnectedSocket() socket: Socket<ServerToClientEvents>,
  ) {
    const { room, user } = this.getUserData(socket);
    const message = this.chatService.setMessage(data.message, room, user);
    this.server.to(room).emit('set/MESSAGES', message);
  }
}
