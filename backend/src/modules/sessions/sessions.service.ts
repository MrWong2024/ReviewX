import { randomBytes } from 'crypto';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Session } from './schemas/session.schema';
import {
  CreateSessionInput,
  SessionUserId,
} from './types/create-session.input';
import {
  CreatedSessionResult,
  PublicSession,
} from './types/public-session.type';

type TimestampedSessionFields = {
  userId: Types.ObjectId;
  expiresAt: Date;
  revokedAt?: Date | null;
  lastSeenAt?: Date | null;
  userAgent?: string | null;
  ip?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type PublicSessionLean = TimestampedSessionFields & {
  _id: Types.ObjectId;
};

type SessionIdLean = {
  _id: Types.ObjectId;
};

@Injectable()
export class SessionsService {
  constructor(
    @InjectModel(Session.name)
    private readonly sessionModel: Model<Session>,
  ) {}

  async createSession(
    input: CreateSessionInput,
  ): Promise<CreatedSessionResult> {
    const expiresAt = this.resolveExpiresAt(input);
    const session = await this.sessionModel.create({
      userId: this.toObjectId(input.userId),
      token: this.generateToken(),
      expiresAt,
      userAgent: input.userAgent ?? null,
      ip: input.ip ?? null,
    });

    const publicSession = this.toPublicSession(
      session.toObject<PublicSessionLean>(),
    );

    return {
      token: session.token,
      session: publicSession,
      expiresAt: publicSession.expiresAt,
    };
  }

  async findValidByToken(token: string): Promise<PublicSession | null> {
    const session = await this.sessionModel
      .findOne({
        token,
        revokedAt: null,
        expiresAt: { $gt: new Date() },
      })
      .select('-token')
      .lean<PublicSessionLean | null>()
      .exec();

    return session ? this.toPublicSession(session) : null;
  }

  async revokeByToken(token: string, date = new Date()): Promise<boolean> {
    const result = await this.sessionModel
      .updateOne(
        {
          token,
          revokedAt: null,
        },
        {
          $set: { revokedAt: date },
        },
      )
      .exec();

    if (result.matchedCount > 0) {
      return true;
    }

    const existing = await this.sessionModel.exists({ token }).exec();
    return existing !== null;
  }

  async revokeAllForUser(
    userId: SessionUserId,
    date = new Date(),
  ): Promise<number> {
    const result = await this.sessionModel
      .updateMany(
        {
          userId: this.toObjectId(userId),
          revokedAt: null,
        },
        {
          $set: { revokedAt: date },
        },
      )
      .exec();

    return result.modifiedCount;
  }

  async touchSession(
    token: string,
    date = new Date(),
  ): Promise<PublicSession | null> {
    const session = await this.sessionModel
      .findOneAndUpdate(
        {
          token,
          revokedAt: null,
          expiresAt: { $gt: date },
        },
        {
          $set: { lastSeenAt: date },
        },
        {
          returnDocument: 'after',
        },
      )
      .select('-token')
      .lean<PublicSessionLean | null>()
      .exec();

    return session ? this.toPublicSession(session) : null;
  }

  async pruneOldSessionsForUser(
    userId: SessionUserId,
    maxActiveSessions: number,
    date = new Date(),
  ): Promise<number> {
    const safeMaxActiveSessions = Math.max(0, maxActiveSessions);
    const activeSessions = await this.sessionModel
      .find({
        userId: this.toObjectId(userId),
        revokedAt: null,
        expiresAt: { $gt: date },
      })
      .select('_id')
      .sort({ createdAt: 1 })
      .lean<SessionIdLean[]>()
      .exec();

    const excessCount = activeSessions.length - safeMaxActiveSessions;
    if (excessCount <= 0) {
      return 0;
    }

    const sessionIdsToRevoke = activeSessions
      .slice(0, excessCount)
      .map((session) => session._id);

    const result = await this.sessionModel
      .updateMany(
        {
          _id: { $in: sessionIdsToRevoke },
          revokedAt: null,
        },
        {
          $set: { revokedAt: date },
        },
      )
      .exec();

    return result.modifiedCount;
  }

  private generateToken(): string {
    return randomBytes(32).toString('hex');
  }

  private resolveExpiresAt(input: CreateSessionInput): Date {
    if (input.expiresAt) {
      return input.expiresAt;
    }

    if (input.ttlMs <= 0) {
      throw new RangeError('ttlMs must be greater than 0');
    }

    return new Date(Date.now() + input.ttlMs);
  }

  private toObjectId(id: SessionUserId): Types.ObjectId {
    return id instanceof Types.ObjectId ? id : new Types.ObjectId(id);
  }

  private toPublicSession(session: PublicSessionLean): PublicSession {
    return {
      id: session._id.toString(),
      userId: session.userId.toString(),
      expiresAt: session.expiresAt,
      revokedAt: session.revokedAt,
      lastSeenAt: session.lastSeenAt,
      userAgent: session.userAgent,
      ip: session.ip,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    };
  }
}
