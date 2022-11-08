import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseInterceptors,
  HttpCode,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { ResponseInterceptor } from '../interceptors/response.interceptor';
import { UserDto } from './dtos/user.dto';
import { CreateUserDto } from './dtos/create-user.dto';

@Controller('api/users')
@UseInterceptors(new ResponseInterceptor(UserDto))
export class UsersController {
  constructor(private usersService: UsersService) {}
  @Get('/all')
  getAllUsers() {
    return this.usersService.getAllUsers();
  }
  @Get('/:id')
  getUserById(@Param('id') id: string) {
    return this.usersService.getUserBy('_id', id);
  }
  @Get('/username/:username')
  getUserByName(@Param('username') username: string) {
    return this.usersService.getUserBy('username', username);
  }
  @Post()
  createUser(@Body() data: CreateUserDto) {
    return this.usersService.createUser(data);
  }
  @Delete('/:id')
  @HttpCode(204)
  deleteUser(@Param('id') id: string) {
    return this.usersService.deleteUser(id);
  }
}
