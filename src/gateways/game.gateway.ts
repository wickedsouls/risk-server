import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameService } from '../game/game.service';
import {
  ClientToServerEvents,
  ServerToClientEvents,
} from '../common/ws-events';
import { AuthService } from '../auth/auth.service';
import { ClientSocket, CreateGameData } from '../game/types';
import { ChatService } from '../chat/chat.service';
import { GameErrors } from '../common/errors';
import { CatchGatewayErrors } from '../decorators/catch-gateway-errors';
import { Earth } from '../game/maps';

const LogEvents = (): MethodDecorator => {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    return descriptor;
  };
};

@WebSocketGateway({
  namespace: '/game',
  cors: { origin: ['http://localhost:3000', 'http://192.168.1.154:3000'] },
})
export class GameGateway implements OnGatewayConnection, OnGatewayInit {
  @WebSocketServer()
  server: Server<ClientToServerEvents, ServerToClientEvents>;

  constructor(
    private authService: AuthService,
    private gameService: GameService,
    private chatService: ChatService,
  ) {}

  afterInit() {}

  async handleConnection(socket: ClientSocket) {
    const token = await socket.handshake.auth.token;
    const user = await this.authService.validateToken(token);
    if (user) {
      socket.data.user = { id: user.id, username: user.username };
      const games = this.gameService.getAllGames();
      socket.emit('set/GAMES', games);
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
    const { room } = this.getUserData(socket);
    const { userId } = this.getUserData(socket);
    const game = this.gameService.leaveTheGame(room, userId);
    socket.leave(room);
    this.server.to(room).emit('set/LEAVE_GAME', game);
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
    this.gameService.startGame(gameId, userId);
    const game = this.gameService.initGame(gameId, Earth, () => {
      this.endTurn(socket);
    });
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
    @MessageBody() payload: { gameId: string; password?: string },
    @ConnectedSocket() socket: Socket<ServerToClientEvents>,
  ) {
    const { gameId, password } = payload;
    const { user } = this.getUserData(socket);
    const game = await this.gameService.joinTheGame(gameId, user, password);
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
    @ConnectedSocket()
    socket: Socket<ServerToClientEvents>,
  ) {
    const { room, user } = this.getUserData(socket);
    const message = this.chatService.setMessage(data.message, room, user);
    this.server.to(room).emit('set/MESSAGE', message);
  }

  @SubscribeMessage<keyof ClientToServerEvents>('request/CANCEL_GAME')
  @CatchGatewayErrors()
  cancelGame(
    @MessageBody() data: { gameId: string },
    @ConnectedSocket()
    socket: Socket<ServerToClientEvents, ServerToClientEvents>,
  ) {
    const { gameId } = data;
    const { userId } = this.getUserData(socket);
    this.gameService.cancelGame(gameId, userId);
    socket.broadcast.to(gameId).emit('set/CANCEL_GAME', { gameId });
    this.server.in(gameId).socketsLeave(gameId);
  }

  @SubscribeMessage<keyof ClientToServerEvents>('request/GET_GAME_INFO')
  @CatchGatewayErrors()
  async getGameInfo(
    @MessageBody() payload: { gameId: string; password?: string },
    @ConnectedSocket() socket: Socket<ServerToClientEvents>,
  ) {
    const { gameId } = payload;
    const { userId } = this.getUserData(socket);
    const game = this.gameService.getGameInfo(gameId, userId);
    const chat = this.chatService.getMessagesForTheRoom(gameId);
    socket.join(gameId);
    return { game, chat };
  }

  @SubscribeMessage<keyof ClientToServerEvents>('request/END_TURN')
  @CatchGatewayErrors()
  endTurn(@ConnectedSocket() socket: Socket<ServerToClientEvents>) {
    const { userId, room } = this.getUserData(socket);
    const game = this.gameService.endTurn(room, userId, () => {
      this.endTurn(socket);
    });
    this.server.to(room).emit('set/UPDATE_GAME', game);
    return game;
  }

  @SubscribeMessage<keyof ClientToServerEvents>('request/PLACE_ARMIES')
  @CatchGatewayErrors()
  @LogEvents()
  placeArmies(
    @MessageBody() payload: { zone: string; amount: number },
    @ConnectedSocket() socket: Socket<ServerToClientEvents>,
  ) {
    const { zone, amount } = payload;
    const { userId, room } = this.getUserData(socket);
    const game = this.gameService.placeArmies(room, userId, amount, zone);
    this.server.to(room).emit('set/UPDATE_GAME', game);
    const selectedZone = game.armiesThisTurn === 0 ? undefined : payload.zone;
    this.server.to(room).emit('set/SELECT_ZONE', { zone: selectedZone });
  }

  @SubscribeMessage<keyof ClientToServerEvents>('request/USE_CARDS')
  @CatchGatewayErrors()
  @LogEvents()
  useCards(
    @MessageBody() payload: { zone: string; amount: number },
    @ConnectedSocket() socket: Socket<ServerToClientEvents>,
  ) {
    const { userId, room } = this.getUserData(socket);
    const game = this.gameService.useCards(room, userId);
    this.server.to(room).emit('set/UPDATE_GAME', game);
  }

  @SubscribeMessage<keyof ClientToServerEvents>('request/SURRENDER')
  @CatchGatewayErrors()
  surender(
    @MessageBody() payload: unknown,
    @ConnectedSocket() socket: Socket<ServerToClientEvents>,
  ) {
    const { room, userId, user } = this.getUserData(socket);
    const game = this.gameService.surrender(room, userId);
    this.server.emit('set/UPDATE_GAME', game);
    const message = this.chatService.setMessage('has surrendered', room, user);
    this.server.to(room).emit('set/MESSAGE', message);
  }

  @SubscribeMessage<keyof ClientToServerEvents>('request/ATTACK_PLAYER')
  @CatchGatewayErrors()
  @LogEvents()
  attackPlayer(
    @MessageBody()
    payload: { zoneFrom: string; zoneTo: string; amount: number },
    @ConnectedSocket() socket: Socket<ServerToClientEvents>,
  ) {
    const { room, userId } = this.getUserData(socket);
    const { zoneFrom, zoneTo, amount } = payload;
    const game = this.gameService.attack(
      room,
      userId,
      amount,
      zoneFrom,
      zoneTo,
    );
    const chat = this.chatService.getMessagesForTheRoom(game.gameId);
    this.server.to(room).emit('set/UPDATE_GAME', game);
    this.server.to(room).emit('set/MESSAGES', chat);
  }

  @SubscribeMessage<keyof ClientToServerEvents>('request/MOVE_ARMY')
  @CatchGatewayErrors()
  @LogEvents()
  moveArmy(
    @MessageBody()
    payload: { zoneFrom: string; zoneTo: string; amount: number },
    @ConnectedSocket() socket: Socket<ServerToClientEvents>,
  ) {
    const { room, userId } = this.getUserData(socket);
    const { zoneFrom, zoneTo, amount } = payload;
    const game = this.gameService.moveArmy(
      room,
      userId,
      amount,
      zoneFrom,
      zoneTo,
    );
    this.server.to(room).emit('set/UPDATE_GAME', game);
  }

  @SubscribeMessage<keyof ClientToServerEvents>('request/SELECT_ZONE_FROM')
  @CatchGatewayErrors()
  selectZoneFrom(
    @MessageBody() payload: { zone?: string },
    @ConnectedSocket() socket: Socket<ServerToClientEvents>,
  ) {
    const { room } = this.getUserData(socket);
    socket.broadcast
      .to(room)
      .emit('set/SELECT_ZONE_FROM', { zone: payload.zone });
  }

  @SubscribeMessage<keyof ClientToServerEvents>('request/SELECT_ZONE_TO')
  @CatchGatewayErrors()
  selectZoneTo(
    @MessageBody() payload: { zone?: string },
    @ConnectedSocket() socket: Socket<ServerToClientEvents>,
  ) {
    const { room } = this.getUserData(socket);
    socket.broadcast
      .to(room)
      .emit('set/SELECT_ZONE_TO', { zone: payload.zone });
  }

  @SubscribeMessage<keyof ClientToServerEvents>('request/FINISH_ATTACK')
  @CatchGatewayErrors()
  finishAttack(@ConnectedSocket() socket: Socket<ServerToClientEvents>) {
    const { room, userId } = this.getUserData(socket);
    const game = this.gameService.finishAttack(room, userId);
    this.server.to(room).emit('set/UPDATE_GAME', game);
  }
}
