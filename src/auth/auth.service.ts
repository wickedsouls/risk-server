import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { AuthDto } from './dtos/auth.dto';
import { PasswordEncryptionService } from './password-encryption.service';
import { plainToInstance } from 'class-transformer';
import { UserDto } from '../users/dtos/user.dto';
import { User } from '../schemas/user.schema';
import { CreateUserDto } from '../users/dtos/create-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly userService: UsersService,
    private readonly passwordEncryptionService: PasswordEncryptionService,
  ) {}

  async validateUser(authDto: AuthDto) {
    const { name, password } = authDto;
    const user = await this.userService.getUserBy('name', name);
    await this.passwordEncryptionService.verifyPassword(
      password,
      user.password,
    );
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
    const hashedPassword = await this.passwordEncryptionService.hashPassword(
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
