import { Module } from '@nestjs/common';
import { GameGateway } from './game.gateway';
import { GameService } from '../game/game.service';
import { AuthService } from '../auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { ChatModule } from '../chat/chat.module';
import { ChatService } from '../chat/chat.service';
import { HistoryModule } from '../history/history.module';
import { HistoryService } from '../history/history.service';

@Module({
  providers: [
    GameGateway,
    GameService,
    JwtService,
    AuthService,
    ChatService,
    HistoryService,
  ],
  imports: [AuthModule, UsersModule, ChatModule, HistoryModule],
})
export class GatewayModule {}
