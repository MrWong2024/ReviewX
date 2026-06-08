import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type SessionDocument = HydratedDocument<Session>;

@Schema({ collection: 'sessions', timestamps: true })
export class Session {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  userId!: Types.ObjectId;

  @Prop({
    type: String,
    required: true,
    unique: true,
  })
  token!: string;

  @Prop({
    type: Date,
    required: true,
    index: { expireAfterSeconds: 0 },
  })
  expiresAt!: Date;

  @Prop({
    type: Date,
    default: null,
  })
  revokedAt?: Date | null;

  @Prop({
    type: Date,
    default: null,
  })
  lastSeenAt?: Date | null;

  @Prop({
    type: String,
    default: null,
  })
  userAgent?: string | null;

  @Prop({
    type: String,
    default: null,
  })
  ip?: string | null;
}

export const SessionSchema = SchemaFactory.createForClass(Session);
