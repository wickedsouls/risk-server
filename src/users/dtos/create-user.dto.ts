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
  firstName;

  @Expose()
  @IsNotEmpty()
  @IsString()
  @IsOptional()
  lastName;

  @Expose()
  @IsNotEmpty()
  @IsString()
  password;

  @Expose()
  @IsNotEmpty()
  @IsString()
  email;
}
