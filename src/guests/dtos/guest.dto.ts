import { Expose, Transform } from 'class-transformer';

export class GuestDto {
  @Expose()
  username;

  @Expose()
  @Transform((guest) => guest.value)
  id;
}
