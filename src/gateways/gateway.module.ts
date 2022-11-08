import { Module } from '@nestjs/common';
import { GameGateway } from './game.gateway';
import { GameService } from '../game/game.service';
import { FakerService } from '../services/faker.service';

@Module({
  providers: [GameGateway, GameService, FakerService],
})
export class GatewayModule {}
