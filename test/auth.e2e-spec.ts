import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { io, Socket } from 'socket.io-client';
import * as request from 'supertest';
import { registrationStubs } from './stubs/auth.stubs';
import { closeConnection } from '../src/db/DatabaseTest';
import { decode } from 'jsonwebtoken';

function connect(accessToken: string) {
  const url = `http://localhost:${process.env.TESTS_PORT}/game`;
  const socket = io(url, {
    auth: { token: accessToken },
  });
  return new Promise((resolve) => {
    socket.on('connect', () => {
      resolve(socket);
    });
  });
}

describe('Game gateway (e2e)', () => {
  let app: INestApplication;
  let socket: Socket;
  let accessToken: string;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.listen(process.env.TESTS_PORT);
    await app.init();
  });

  afterAll(async () => {
    if (socket) socket.close();
  });

  afterEach(async () => {
    await closeConnection();
    await app.close();
  });

  it('should create an account and connect to WS', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send(registrationStubs.user)
      .expect(201);
    accessToken = res.body.accessToken;
    const { id, username } = decode(accessToken) as any;
    expect(id).toBeDefined();
    expect(username).toBe(registrationStubs.user.username);
    socket = (await connect(accessToken)) as any;
    expect(socket.connected).toBeTruthy();
  });
});
