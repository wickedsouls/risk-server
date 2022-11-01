import { Expose } from 'class-transformer';
import { IsOptional } from 'class-validator';

export class CreateGuestDto {
  @Expose()
  name;

  @Expose()
  @IsOptional()
  ip?: string;

  @Expose()
  @IsOptional()
  lastGameAt?: string;

  @Expose()
  @IsOptional()
  invitedBy?: string;
}
