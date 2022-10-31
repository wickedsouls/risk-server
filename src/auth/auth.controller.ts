import { Controller, Post, Body, UseInterceptors } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto } from './dtos/auth.dto';
import { RegisterDto } from './dtos/register.dto';
import { CreateUserDto } from '../users/dtos/create-user.dto';
import { ResponseInterceptor } from '../interceptors/response.interceptor';

@Controller('auth')
@UseInterceptors(new ResponseInterceptor(RegisterDto))
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/login')
  login(@Body() authDto: AuthDto) {
    return this.authService.login(authDto);
  }

  @Post('/register')
  async register(@Body() crateUserDto: CreateUserDto) {
    return this.authService.register(crateUserDto);
  }
}
