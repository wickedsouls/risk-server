import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema()
export class User {
  @Prop({
    type: String,
    unique: true,
    required: true,
    maxlength: 20,
    minlength: 3,
  })
  name;
  @Prop({ type: String, maxlength: 30, minlength: 3 })
  firstName;
  @Prop({ type: String, maxlength: 30, minlength: 3 })
  lastName;
  @Prop({ type: String })
  password;
  @Prop({
    type: String,
    unique: true,
    required: true,
    maxlength: 50,
    minlength: 3,
  })
  email;
  @Prop({ type: Date, default: Date.now() })
  createdAt;
  @Prop({ type: Date, default: Date.now() })
  lastLoginAt;
}

export const UserSchema = SchemaFactory.createForClass(User);
