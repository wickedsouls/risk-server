import { IsString, IsNotEmpty } from 'class-validator';
import { Expose } from 'class-transformer';

export class AuthDto {
  @Expose()
  @IsNotEmpty()
  @IsString()
  username: string;

  @Expose()
  @IsNotEmpty()
  @IsString()
  password: string;
}
