import { Module } from '@nestjs/common';
import { GameGateway } from './game.gateway';
import { GameService } from '../game/game.service';
import { AuthService } from '../auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { ChatModule } from '../chat/chat.module';
import { ChatService } from '../chat/chat.service';

@Module({
  providers: [GameGateway, GameService, JwtService, AuthService, ChatService],
  imports: [AuthModule, UsersModule, ChatModule],
})
export class GatewayModule {}
