import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import { Model } from 'mongoose';
import { CreateUserDto } from './dtos/create-user.dto';
import { MongoIdOrString } from '../common/types';

@Injectable()
export class UsersRepository {
  constructor(@InjectModel(User.name) private userRepo: Model<User>) {}
  getAllUsers(): Promise<UserDocument[]> {
    return this.userRepo.find({}).exec();
  }
  getUserBy(
    key: string,
    value: MongoIdOrString,
  ): Promise<UserDocument | undefined> {
    return this.userRepo.findOne({ [key]: value }).exec();
  }
  getUserByUsernameOrEmail(value: string): Promise<UserDocument> {
    return this.userRepo
      .findOne({
        $or: [{ email: value }, { username: value }],
      })
      .exec();
  }
  getUserById(id: MongoIdOrString): Promise<UserDocument | undefined> {
    return this.userRepo.findById(id).exec();
  }
  createUser(data: CreateUserDto): Promise<UserDocument> {
    return this.userRepo.create(data);
  }
  async deleteUser(id: MongoIdOrString) {
    await this.userRepo.deleteOne({ _id: id });
  }
}
