import { Module } from '@nestjs/common';
import { FakerService } from '../services/faker.service';

@Module({
  providers: [FakerService],
  exports: [FakerService],
})
export class FakerModule {}
