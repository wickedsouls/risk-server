import { Injectable } from '@nestjs/common';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { appConfig } from '../config/app.config';
import { UserDto } from '../users/dtos/user.dto';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: true,
      secretOrKey: appConfig().jwtKey,
    });
  }
  async validate(payload: UserDto) {
    return payload;
  }
}
