import { Module } from '@nestjs/common';
import { GuestsController } from './guests.controller';
import { GuestsService } from './guests.service';
import { FakerService } from '../services/faker.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Guest, GuestSchema } from '../schemas/guest.schema';
import { GuestsRepository } from './guests.repository';

@Module({
  controllers: [GuestsController],
  providers: [GuestsService, GuestsRepository, FakerService],
  imports: [
    MongooseModule.forFeature([{ schema: GuestSchema, name: Guest.name }]),
  ],
})
export class GuestsModule {}
