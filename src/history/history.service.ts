import { Injectable } from '@nestjs/common';
import { HistoryEvent } from './types';

@Injectable()
export class HistoryService {
  events: {
    [key: string]: HistoryEvent[];
  };
  createHistory() {}
  addEvent(gameId: string, event: HistoryEvent) {
    this.events[gameId].push(event);
  }
  getGameEvents(gameId: string) {
    return this.events[gameId];
  }
  createEventListForGame(gameId: string) {
    this.events[gameId] = [];
  }
}
