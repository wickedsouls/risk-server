import { IsString } from 'class-validator';
import { Expose } from 'class-transformer';

export class AuthDto {
  @Expose()
  @IsString()
  name: string;

  @Expose()
  @IsString()
  password: string;
}
