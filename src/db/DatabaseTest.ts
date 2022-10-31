import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import * as mongoose from 'mongoose';

let mongod: MongoMemoryServer;

@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: async () => {
        mongod = await MongoMemoryServer.create();
        const uri = mongod.getUri();
        return { uri };
      },
    }),
  ],
})
export class DatabaseTest {}

export const closeConnection = async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
};
