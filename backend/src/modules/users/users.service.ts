import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { hash } from 'bcryptjs';
import { Model, Types } from 'mongoose';
import { CreateUserInput } from './dto/create-user.input';
import { User } from './schemas/user.schema';
import { AuthIdentity, PublicUser } from './types/public-user.type';
import { UserRole } from './types/user-role.type';
import { UserStatus } from './types/user-status.type';

type TimestampedUserFields = {
  phone: string;
  name: string;
  roles: UserRole[];
  organizationIds?: Types.ObjectId[];
  disciplineIds?: Types.ObjectId[];
  mustChangePassword?: boolean;
  isActive?: boolean;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date | null;
};

type PublicUserLean = TimestampedUserFields & {
  _id: Types.ObjectId;
};

type AuthIdentityLean = {
  _id: Types.ObjectId;
  phone: string;
  passwordHash: string;
  roles: UserRole[];
  isActive?: boolean;
  status: UserStatus;
};

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
  ) {}

  async create(input: CreateUserInput): Promise<PublicUser> {
    const user = await this.userModel.create({
      ...input,
      phone: input.phone.trim(),
      name: input.name.trim(),
    });

    return this.toPublicUser(user.toObject<PublicUserLean>());
  }

  async createWithPlainPassword(input: {
    phone: string;
    password: string;
    name: string;
    roles?: UserRole[];
    organizationIds?: string[];
    disciplineIds?: string[];
    mustChangePassword?: boolean;
    isActive?: boolean;
  }): Promise<PublicUser> {
    return this.create({
      phone: input.phone,
      passwordHash: await hash(input.password, 12),
      name: input.name,
      roles: input.roles,
      organizationIds: input.organizationIds,
      disciplineIds: input.disciplineIds,
      mustChangePassword: input.mustChangePassword,
      isActive: input.isActive,
    });
  }

  async findById(id: string): Promise<PublicUser | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }

    const user = await this.userModel
      .findById(id)
      .lean<PublicUserLean | null>()
      .exec();

    return user ? this.toPublicUser(user) : null;
  }

  async findByPhone(phone: string): Promise<PublicUser | null> {
    const user = await this.userModel
      .findOne({ phone: phone.trim() })
      .lean<PublicUserLean | null>()
      .exec();

    return user ? this.toPublicUser(user) : null;
  }

  async findAuthIdentityByPhone(phone: string): Promise<AuthIdentity | null> {
    const user = await this.userModel
      .findOne({ phone: phone.trim() })
      .select('+passwordHash')
      .lean<AuthIdentityLean | null>()
      .exec();

    return user
      ? {
          id: user._id.toString(),
          phone: user.phone,
          passwordHash: user.passwordHash,
          roles: user.roles,
          isActive: user.isActive ?? true,
          status: user.status,
        }
      : null;
  }

  async updateLastLoginAt(
    userId: string,
    date = new Date(),
  ): Promise<PublicUser | null> {
    if (!Types.ObjectId.isValid(userId)) {
      return null;
    }

    const user = await this.userModel
      .findByIdAndUpdate(
        userId,
        { $set: { lastLoginAt: date } },
        { returnDocument: 'after' },
      )
      .lean<PublicUserLean | null>()
      .exec();

    return user ? this.toPublicUser(user) : null;
  }

  private toPublicUser(user: PublicUserLean): PublicUser {
    return {
      id: user._id.toString(),
      phone: user.phone,
      name: user.name,
      roles: user.roles,
      organizationIds: (user.organizationIds ?? []).map((id) => id.toString()),
      disciplineIds: (user.disciplineIds ?? []).map((id) => id.toString()),
      mustChangePassword: user.mustChangePassword ?? false,
      isActive: user.isActive ?? true,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLoginAt: user.lastLoginAt,
    };
  }
}
