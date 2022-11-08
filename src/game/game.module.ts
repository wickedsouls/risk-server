import { Module } from '@nestjs/common';
import { GameService } from './game.service';
import { FakerService } from '../services/faker.service';
import { FakerModule } from '../services/faker.module';

@Module({
  providers: [GameService, FakerService],
  imports: [FakerModule],
})
export class GameModule {}
