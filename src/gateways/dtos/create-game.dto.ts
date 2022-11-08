import { IsOptional, IsBoolean, IsString } from 'class-validator';

export class CreateGameDto {
  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;

  @IsOptional()
  @IsString()
  password?: string;
}
