import {
  Controller,
  Post,
  Get,
  Delete,
  UseInterceptors,
  HttpCode,
  Param,
} from '@nestjs/common';
import { GuestsService } from './guests.service';
import { ResponseInterceptor } from '../interceptors/response.interceptor';
import { GuestDto } from './dtos/guest.dto';
import { RealIP } from 'nestjs-real-ip';
import * as moment from 'moment';

@Controller('guests')
@UseInterceptors(new ResponseInterceptor(GuestDto))
export class GuestsController {
  constructor(private guestService: GuestsService) {}

  @Get('/all')
  getAllGuests() {
    return this.guestService.getAllGuests();
  }

  @Post()
  createNewGuest(@RealIP() ip: string) {
    return this.guestService.createGuest(ip);
  }

  @Delete('/all')
  @HttpCode(204)
  deleteAllGuests() {
    this.guestService.deleteAllGuests();
  }

  @Delete('/up-to/:date')
  @HttpCode(204)
  deleteOldQuests(@Param('date') date: string) {
    return this.guestService.deleteOldGuestsUpTo(date);
  }

  @Delete('/:id')
  @HttpCode(204)
  deleteGuest(@Param('id') id: string) {
    this.guestService.deleteGuest(id);
  }
}
