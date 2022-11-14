import { Test, TestingModule } from '@nestjs/testing';
import { GuestsService } from './guests.service';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connect, Connection, Model } from 'mongoose';
import { Guest, GuestSchema } from '../schemas/guest.schema';
import { FakerService } from '../services/faker.service';
import { getModelToken } from '@nestjs/mongoose';
import { GuestsRepository } from './guests.repository';

describe('GuestsService', () => {
  let service: GuestsService;
  let mongod: MongoMemoryServer;
  let mongoConnection: Connection;
  let guestModel: Model<Guest>;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    mongoConnection = (await connect(uri)).connection;
    guestModel = mongoConnection.model(Guest.name, GuestSchema);
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GuestsService,
        GuestsRepository,
        FakerService,
        { provide: getModelToken(Guest.name), useValue: guestModel },
      ],
    }).compile();

    service = module.get<GuestsService>(GuestsService);
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

  it('should create guest', async () => {
    const guest1 = await service.createGuest();
    const guest2 = await service.createGuest();
    expect(guest1).toBeDefined();
    expect(guest2).toBeDefined();
    expect(guest1.username).not.toBe(guest2.username);
  });
  it('should get all guests', async () => {
    await guestModel.create({ username: 'one' });
    await guestModel.create({ username: 'two' });
    const guests = await service.getAllGuests();
    expect(guests.length).toBe(2);
  });
  it('should delete all guests', async () => {
    await guestModel.create({ username: 'one' });
    await guestModel.create({ username: 'two' });
    await service.deleteAllGuests();
    const guests = await guestModel.find({});
    expect(guests.length).toBe(0);
  });
  it('should delete guest by id', async () => {
    const guest = await guestModel.create({ username: 'one' });
    await service.deleteGuest(guest._id);
    const guests = await guestModel.find({});
    expect(guests.length).toBe(0);
  });
  it('should delete old inactive guests', async () => {
    await guestModel.create({
      username: 'one',
      createdAt: new Date('2000-01-01'),
    });
    await guestModel.create({
      username: 'two',
      createdAt: new Date('2020-01-01'),
    });
    await service.deleteOldGuestsUpTo('2010-01-01');
    const guests = await guestModel.find({});
    expect(guests.length).toBe(1);
    expect(guests[0].username).toBe('two');
  });
});
