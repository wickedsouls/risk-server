import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { DatabaseProduction } from './db/DatabaseProduction';
import { DatabaseTest } from './db/DatabaseTest';
import { isTestEnv } from './utils/environment';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    UsersModule,
    AuthModule,
    isTestEnv ? DatabaseTest : DatabaseProduction,
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
  ],
})
export class AppModule {}
