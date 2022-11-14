import { IsOptional, IsBoolean, IsNumber, IsString } from 'class-validator';

export class CreateGameDto {
  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;

  @IsOptional()
  @IsString()
  password?: string;

  @IsNumber()
  minPlayers: number;

  @IsNumber()
  maxPlayers: number;
}
