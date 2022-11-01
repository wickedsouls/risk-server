import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Guest, GuestDocument } from '../schemas/guest.schema';
import { Model } from 'mongoose';
import { CreateGuestDto } from './dtos/create-guest.dto';
import { MongoIdOrString } from '../common/types';

@Injectable()
export class GuestsRepository {
  constructor(@InjectModel(Guest.name) private guestRepo: Model<Guest>) {}
  getAllGuests(): Promise<GuestDocument[]> {
    return this.guestRepo.find({}).exec();
  }
  createGuest(data: CreateGuestDto) {
    return this.guestRepo.create(data);
  }
  async deleteAllGuests() {
    await this.guestRepo.deleteMany({});
  }
  async deleteGuest(id: MongoIdOrString) {
    await this.guestRepo.deleteOne({ _id: id });
  }
  async deleteOldGuests(date: Date) {
    await this.guestRepo.deleteMany({ createdAt: { $lt: date } });
  }
}
