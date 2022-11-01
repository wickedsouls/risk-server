import { Expose, Transform } from 'class-transformer';

export class GuestDto {
  @Expose()
  name;

  @Expose()
  @Transform((guest) => guest.value)
  id;
}
