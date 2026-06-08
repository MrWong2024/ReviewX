import { Types } from 'mongoose';

export type SessionUserId = string | Types.ObjectId;

interface CreateSessionBaseInput {
  userId: SessionUserId;
  userAgent?: string;
  ip?: string;
}

export type CreateSessionInput =
  | (CreateSessionBaseInput & {
      ttlMs: number;
      expiresAt?: never;
    })
  | (CreateSessionBaseInput & {
      expiresAt: Date;
      ttlMs?: never;
    });
