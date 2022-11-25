import { Module } from '@nestjs/common';
import { GameService } from './game.service';
import { HistoryModule } from '../history/history.module';
import { HistoryService } from '../history/history.service';
import { ChatModule } from '../chat/chat.module';
import { ChatService } from '../chat/chat.service';

@Module({
  providers: [GameService, HistoryService, ChatService],
  imports: [HistoryModule, ChatModule],
})
export class GameModule {}
