import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { MongoIdOrString } from '../common/types';
import { CreateUserDto } from './dtos/create-user.dto';
import { ErrorMessages } from '../constants/errorMessages';
import { ValidateMongoId } from '../decorators/validateMongoId';
import { UserDocument } from '../schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(private usersRepo: UsersRepository) {}
  getAllUsers() {
    return this.usersRepo.getAllUsers();
  }
  async createUser(data: CreateUserDto) {
    const { name, email } = data;
    let user: UserDocument;
    user = await this.usersRepo.getUserBy('name', name);
    if (user) {
      throw new BadRequestException(ErrorMessages.USER_ALREADY_EXISTS);
    }
    user = await this.usersRepo.getUserBy('email', email);
    if (user) {
      throw new BadRequestException(ErrorMessages.USER_ALREADY_EXISTS);
    }
    return this.usersRepo.createUser(data);
  }
  async getUserBy(key: string, value: string) {
    const user = await this.usersRepo.getUserBy(key, value);
    if (!user) {
      throw new NotFoundException(ErrorMessages.USER_NOT_FOUND);
    }
    return user;
  }
  @ValidateMongoId()
  async getUserById(id: MongoIdOrString) {
    const user = await this.usersRepo.getUserById(id);
    if (!user) {
      throw new NotFoundException(ErrorMessages.USER_NOT_FOUND);
    }
    return user;
  }
  @ValidateMongoId()
  async deleteUser(id: MongoIdOrString) {
    const user = await this.usersRepo.getUserBy('_id', id);
    if (!user) {
      throw new NotFoundException(ErrorMessages.USER_NOT_FOUND);
    }
    await this.usersRepo.deleteUser(id);
  }
}
