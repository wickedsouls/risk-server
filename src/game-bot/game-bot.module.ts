import { Module } from '@nestjs/common';
import { GameBotService } from './game-bot.service';

@Module({
  providers: [GameBotService],
})
export class GameBotModule {}
