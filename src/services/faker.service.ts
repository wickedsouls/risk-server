import { Injectable } from '@nestjs/common';
import * as Chance from 'chance';

@Injectable()
export class FakerService {
  private chance = new Chance();

  createName() {
    let first = this.chance.word();
    first = first.charAt(0).toUpperCase() + first.slice(1);
    let second = this.chance.word();
    second = second.charAt(0).toUpperCase() + second.slice(1);
    return first + second;
  }

  createIp() {
    return this.chance.ip();
  }
}
