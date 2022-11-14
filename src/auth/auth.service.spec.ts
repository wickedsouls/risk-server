import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connect, Connection, Model } from 'mongoose';
import { User, UserSchema } from '../schemas/user.schema';
import { JwtStrategy } from './jwt.strategy';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { UsersRepository } from '../users/users.repository';
import { getModelToken } from '@nestjs/mongoose';
import { authCredentialsStubs } from '../../test/stubs/auth.stubs';
import { HttpErrors } from '../common/errors';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

describe('AuthService', () => {
  let service: AuthService;
  let mongod: MongoMemoryServer;
  let mongoConnection: Connection;
  let userModel: Model<User>;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    mongoConnection = (await connect(uri)).connection;
    userModel = mongoConnection.model(User.name, UserSchema);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        JwtStrategy,
        UsersService,
        UsersRepository,
        { provide: getModelToken(User.name), useValue: userModel },
      ],
      imports: [
        PassportModule,
        JwtModule.register({
          secret: 'secret',
          signOptions: { expiresIn: '3600s' },
        }),
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(async () => {
    const collections = mongoConnection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  });

  afterAll(async () => {
    await mongoConnection.dropDatabase();
    await mongoConnection.close();
    await mongod.stop();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register user', () => {
    it('should register new user', async () => {
      const { accessToken } = await service.register(authCredentialsStubs.user);
      expect(accessToken).toBeDefined();
    });
    it('should fail if email or name is not provided', async () => {
      await expect(
        service.register({ ...authCredentialsStubs.user, username: undefined }),
      ).rejects.toThrow();
      await expect(
        service.register({ ...authCredentialsStubs.user, email: undefined }),
      ).rejects.toThrow();
    });
    it('should throw error when registering same user again', async () => {
      await userModel.create(authCredentialsStubs.user);
      await expect(service.register(authCredentialsStubs.user)).rejects.toThrow(
        HttpErrors.USER_ALREADY_EXISTS,
      );
    });
  });

  describe('login user', () => {
    it('should login user', async () => {
      const hash = await bcrypt.hash('secret', 11);
      await userModel.create({
        username: authCredentialsStubs.user.username,
        email: authCredentialsStubs.user.email,
        password: hash,
      });
      const token = await service.login({
        username: authCredentialsStubs.user.username,
        password: authCredentialsStubs.user.password,
      });
      expect(token).toBeDefined();
    });
    it('should login user with email and with username', async () => {
      const hash = await bcrypt.hash('secret', 11);
      await userModel.create({
        username: authCredentialsStubs.user.username,
        email: authCredentialsStubs.user.email,
        password: hash,
      });
      const { accessToken: tokenFromEmail } = await service.login({
        username: authCredentialsStubs.user.email,
        password: authCredentialsStubs.user.password,
      });
      const { accessToken: tokenFromUsername } = await service.login({
        username: authCredentialsStubs.user.username,
        password: authCredentialsStubs.user.password,
      });
      expect(tokenFromEmail).toBeDefined();
      expect(tokenFromUsername).toBeDefined();
      expect(tokenFromUsername).toBe(tokenFromEmail);
    });
    it('should fail to login with bad credentials', async () => {
      const hash = await bcrypt.hash('secret', 11);
      await userModel.create({
        username: authCredentialsStubs.user.username,
        password: hash,
        email: authCredentialsStubs.user.email,
      });
      await expect(
        service.login({
          username: authCredentialsStubs.user.username,
          password: '123',
        }),
      ).rejects.toThrow(HttpErrors.INVALID_CREDENTIALS);
    });
  });
});
