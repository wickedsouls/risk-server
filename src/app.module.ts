import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { DatabaseProduction } from './db/DatabaseProduction';
import { DatabaseTest } from './db/DatabaseTest';
import { isTestEnv } from './utils/environment';
import { ConfigModule } from '@nestjs/config';
import { GuestsModule } from './guests/guests.module';
import { GatewayModule } from './gateways/gateway.module';
import { GameModule } from './game/game.module';
import { FakerModule } from './services/faker.module';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [
    UsersModule,
    AuthModule,
    isTestEnv ? DatabaseTest : DatabaseProduction,
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
    GuestsModule,
    GatewayModule,
    GameModule,
    FakerModule,
    ChatModule,
  ],
})
export class AppModule {}
