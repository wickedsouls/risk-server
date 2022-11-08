import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { AuthDto } from './dtos/auth.dto';
import { passwordEncryption } from '../utils/password-encription';
import { plainToInstance } from 'class-transformer';
import { UserDto } from '../users/dtos/user.dto';
import { User } from '../schemas/user.schema';
import { CreateUserDto } from '../users/dtos/create-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UsersService,
  ) {}

  async validateUser(authDto: AuthDto) {
    const { username, password } = authDto;
    const user = await this.userService.getUserByUsernameOrEmail(username);
    await passwordEncryption.verifyPassword(password, user.password);
    return user;
  }

  createToken(user: User) {
    const mappedUser = plainToInstance(UserDto, user, {
      excludeExtraneousValues: true,
    });
    return this.jwtService.sign({ ...mappedUser });
  }

  async login(authDto: AuthDto) {
    const user = await this.validateUser(authDto);

    return {
      accessToken: this.createToken(user),
    };
  }

  async register(createUserDto: CreateUserDto) {
    const hashedPassword = await passwordEncryption.hashPassword(
      createUserDto.password,
    );
    const user = await this.userService.createUser({
      ...createUserDto,
      password: hashedPassword,
    });

    return {
      accessToken: this.createToken(user),
    };
  }
}
