import { Test, TestingModule } from '@nestjs/testing';
import { GameGateway } from './game.gateway';
import { config } from 'dotenv';
import { GameService } from '../game/game.service';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../auth/auth.service';
import { ChatService } from '../chat/chat.service';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { ChatModule } from '../chat/chat.module';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connect, Connection } from 'mongoose';
import { closeConnection, DatabaseTest } from '../db/DatabaseTest';
import { playerStub } from '../../test/stubs/game.stub';
import { Server } from 'socket.io';
import { ClientSocket } from '../game/types';
import { sign } from 'jsonwebtoken';

config();

describe('Game Gateway', () => {
  let gateway: GameGateway;
  let mongod: MongoMemoryServer;
  let mongoConnection: Connection;
  let game;
  const socketMock = {
    data: { user: playerStub() },
    rooms: [],
    join: jest.fn(),
    emit: jest.fn(),
    leave: jest.fn(),
    broadcast: { to: jest.fn().mockReturnValue({ emit: jest.fn() }) },
    disconnect: jest.fn(),
    handshake: { auth: { token: '' } },
  } as unknown as ClientSocket;

  const serverMock = {
    emit: jest.fn(),
    in: jest.fn().mockReturnValue({ socketsLeave: jest.fn() }),
    to: jest.fn().mockReturnValue({ emit: jest.fn() }),
  } as unknown as Server;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    mongoConnection = (await connect(uri)).connection;
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GameGateway,
        GameService,
        JwtService,
        AuthService,
        ChatService,
      ],
      imports: [AuthModule, UsersModule, ChatModule, DatabaseTest],
    }).compile();

    gateway = module.get<GameGateway>(GameGateway);
    gateway.server = serverMock;
  });

  afterAll(async () => {
    await mongoConnection.dropDatabase();
    await mongoConnection.close();
    await mongod.stop();
    await closeConnection();
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
  it('should handle connection', async () => {
    const accessToken = sign(
      { id: '1', username: 'user' },
      process.env.JWT_KEY,
    );
    socketMock.handshake.auth.token = accessToken;
    const socket = await gateway.handleConnection(socketMock);
    expect(socket.data.user).toBeDefined();
  });
  it('should create a game', async () => {
    game = await gateway.createGame(
      { maxPlayers: 6, minPlayers: 1 },
      socketMock,
    );
    expect(game).toBeDefined();
    expect(serverMock.emit).toBeCalledWith('set/GAMES', expect.anything());
  });
  it('should join the game', async () => {
    const response = await gateway.joinTheGame(
      { gameId: game.gameId },
      socketMock,
    );
    expect(response).toHaveProperty('chat');
    expect(response).toHaveProperty('game');
    expect(serverMock.emit).toBeCalledWith('set/GAMES', expect.anything());
    expect(serverMock.to(game.gameId).emit).toBeCalledWith(
      'set/JOIN_GAME',
      expect.anything(),
    );
    expect(socketMock.join).toBeCalledWith(game.gameId);
  });
  it('should start the game', async () => {
    gateway.startTheGame({ gameId: game.gameId }, socketMock);
    expect(serverMock.to(game.gameId).emit).toBeCalledWith(
      'set/START_GAME',
      expect.anything(),
    );
    expect(serverMock.emit).toBeCalledWith('set/GAMES', expect.anything());
  });
  it('should leave the game', async () => {
    const { gameId } = await gateway.createGame(
      { maxPlayers: 6, minPlayers: 1 },
      socketMock,
    );
    gateway.leaveTheGame({ gameId }, socketMock);
    expect(serverMock.emit).toBeCalledWith('set/GAMES', expect.anything());
    expect(serverMock.to(gameId).emit).toBeCalledWith(
      'set/LEAVE_GAME',
      expect.anything(),
    );
    expect(socketMock.leave).toBeCalledWith(gameId);
  });
  it('should receive message', async () => {
    gateway.receiveMessage({ message: 'hi' }, socketMock);
    expect(serverMock.to(game.gameId).emit).toBeCalledWith(
      'set/MESSAGES',
      expect.anything(),
    );
  });
  it('should cancel the game', async () => {
    const { gameId } = await gateway.createGame(
      { maxPlayers: 6, minPlayers: 1 },
      socketMock,
    );
    gateway.cancelGame({ gameId: gameId }, socketMock);
    expect(socketMock.broadcast.to(gameId).emit).toBeCalledWith(
      'set/CANCEL_GAME',
      expect.anything(),
    );
    expect(serverMock.in(gameId).socketsLeave).toBeCalledWith(gameId);
  });
  it('should get all games', () => {
    expect(gateway.getAllGames).toBeDefined();
  });
});
