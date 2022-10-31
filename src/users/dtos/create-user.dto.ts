import { IsString, IsOptional } from 'class-validator';
import { Expose } from 'class-transformer';

export class CreateUserDto {
  @Expose()
  @IsString()
  name;
  @Expose()
  @IsString()
  @IsOptional()
  firstName;
  @Expose()
  @IsString()
  @IsOptional()
  lastName;
  @Expose()
  @IsString()
  password;
  @Expose()
  @IsString()
  email;
}
