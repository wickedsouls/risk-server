import { Expose, Transform } from 'class-transformer';

export class UserDto {
  @Expose()
  name;
  @Expose()
  firstName;
  @Expose()
  lastName;
  @Expose()
  email;
  @Expose()
  @Transform((user) => user.value)
  id: string;
}
