import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { Expose } from 'class-transformer';

export class CreateUserDto {
  @Expose()
  @IsNotEmpty()
  @IsString()
  username;

  @Expose()
  @IsNotEmpty()
  @IsString()
  @IsOptional()
  firstName?: string;

  @Expose()
  @IsNotEmpty()
  @IsString()
  @IsOptional()
  lastName?: string;

  @Expose()
  @IsNotEmpty()
  @IsString()
  password;

  @Expose()
  @IsNotEmpty()
  @IsString()
  email;
}
