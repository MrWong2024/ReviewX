import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { USER_ROLES } from '../../../common/constants/user-roles';
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
    enum: USER_ROLES,
    default: [],
  })
  roles!: UserRole[];

  @Prop({
    type: [{ type: Types.ObjectId, ref: 'Organization' }],
    default: [],
  })
  organizationIds!: Types.ObjectId[];

  @Prop({
    type: [{ type: Types.ObjectId, ref: 'TreeDictionary' }],
    default: [],
  })
  disciplineIds!: Types.ObjectId[];

  @Prop({
    type: Boolean,
    default: false,
    required: true,
  })
  mustChangePassword!: boolean;

  @Prop({
    type: Boolean,
    default: true,
    required: true,
  })
  isActive!: boolean;

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
