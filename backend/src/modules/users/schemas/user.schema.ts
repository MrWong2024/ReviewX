import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import type { UserRole } from '../types/user-role.type';
import { DEFAULT_USER_STATUS, USER_STATUSES } from '../types/user-status.type';
import type { UserStatus } from '../types/user-status.type';

export type UserDocument = HydratedDocument<User>;

@Schema({ collection: 'users', timestamps: true })
export class User {
  @Prop({
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 1,
  })
  phone!: string;

  @Prop({
    type: String,
    required: true,
    select: false,
  })
  passwordHash!: string;

  @Prop({
    type: String,
    required: true,
    trim: true,
    minlength: 1,
  })
  name!: string;

  @Prop({
    type: [String],
    default: [],
  })
  roles!: UserRole[];

  @Prop({
    type: String,
    enum: USER_STATUSES,
    default: DEFAULT_USER_STATUS,
    required: true,
  })
  status!: UserStatus;

  @Prop({
    type: Date,
    default: null,
  })
  lastLoginAt?: Date | null;
}

export const UserSchema = SchemaFactory.createForClass(User);
