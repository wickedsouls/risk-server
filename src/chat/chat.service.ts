import { Injectable } from '@nestjs/common';
import { ClientSocket, Message, Player } from '../game/types';
import { Server } from 'socket.io';
import {
  ClientToServerEvents,
  ServerToClientEvents,
} from '../common/ws-events';

@Injectable()
export class ChatService {
  private chat: { [key: string]: Message[] } = {};

  createChatRoom(gameId) {
    this.chat[gameId] = [];
    return this.chat[gameId];
  }

  setMessage(message: string, room: string, player: Player) {
    if (!this.chat[room]) {
      this.createChatRoom(room);
    }
    const messageBody: Message = {
      player: player,
      message,
      createdAt: new Date(),
    };
    const chat = this.chat[room];
    chat.push(messageBody);
    return messageBody;
  }

  getMessagesForTheRoom(room: string) {
    return this.chat[room];
  }
}
