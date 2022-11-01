import { Prop, SchemaFactory, Schema } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from './user.schema';

export type GuestDocument = Document & Guest;

@Schema()
export class Guest {
  @Prop({ type: String, required: true })
  name;
  @Prop({ type: Date, default: Date.now() })
  createdAt;
  @Prop({ type: Date })
  lastGameAt;
  @Prop({ type: String })
  ip;
  @Prop({ type: Types.ObjectId, ref: User.name })
  invitedBy;
}

export const GuestSchema = SchemaFactory.createForClass(Guest);
