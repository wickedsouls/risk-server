import { BadRequestException, Injectable } from '@nestjs/common';
import { GuestsRepository } from './guests.repository';
import { FakerService } from '../services/faker.service';
import { ValidateMongoId } from '../decorators/validateMongoId';
import { MongoIdOrString } from '../common/types';
import * as moment from 'moment';
import { ErrorMessages } from '../constants/errorMessages';

@Injectable()
export class GuestsService {
  constructor(
    private guestRepo: GuestsRepository,
    private faker: FakerService,
  ) {}

  createGuest(ip?: string) {
    const name = this.faker.createName();
    return this.guestRepo.createGuest({ name, ip });
  }

  getAllGuests() {
    return this.guestRepo.getAllGuests();
  }

  async deleteAllGuests() {
    await this.guestRepo.deleteAllGuests();
  }

  @ValidateMongoId()
  async deleteGuest(id: MongoIdOrString) {
    return this.guestRepo.deleteGuest(id);
  }

  async deleteOldGuestsUpTo(date: string) {
    await this.guestRepo.deleteOldGuests(new Date(date));
  }
}
