import { CreateUserDto } from '../../users/dtos/create-user.dto';
import { Expose } from 'class-transformer';

export class RegisterDto extends CreateUserDto {
  @Expose()
  accessToken: string;
}
