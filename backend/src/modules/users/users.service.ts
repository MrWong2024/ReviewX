import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { compare, hash } from 'bcryptjs';
import { Model, Types } from 'mongoose';
import { USER_ROLES } from '../../common/constants/user-roles';
import { PaginatedResponse } from '../../common/dto/pagination-query.dto';
import {
  ensureUniqueStrings,
  escapeRegExp,
  toObjectId,
} from '../../common/utils/mongo-query';
import { Organization } from '../organizations/schemas/organization.schema';
import { TreeDictionary } from '../tree-dictionaries/schemas/tree-dictionary.schema';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { CreateUserInput } from './dto/create-user.input';
import { QueryAdminUsersDto } from './dto/query-admin-users.dto';
import { ResetAdminUserPasswordDto } from './dto/reset-admin-user-password.dto';
import { UpdateAdminUserStatusDto } from './dto/update-admin-user-status.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';
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

type ChangeOwnPasswordUserLean = PublicUserLean & {
  passwordHash: string;
};

export type AdminUserResponse = {
  id: string;
  phone: string;
  name: string;
  roles: UserRole[];
  organizationIds: string[];
  disciplineIds: string[];
  mustChangePassword: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
    @InjectModel(Organization.name)
    private readonly organizationModel: Model<Organization>,
    @InjectModel(TreeDictionary.name)
    private readonly treeDictionaryModel: Model<TreeDictionary>,
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

  async listAdminUsers(
    query: QueryAdminUsersDto,
  ): Promise<PaginatedResponse<AdminUserResponse>> {
    const filter = this.buildAdminUserFilter(query);
    const [items, total] = await Promise.all([
      this.userModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((query.page - 1) * query.pageSize)
        .limit(query.pageSize)
        .lean<PublicUserLean[]>()
        .exec(),
      this.userModel.countDocuments(filter).exec(),
    ]);

    return {
      items: items.map((item) => this.toAdminUserResponse(item)),
      page: query.page,
      pageSize: query.pageSize,
      total,
    };
  }

  async createAdminUser(dto: CreateAdminUserDto): Promise<AdminUserResponse> {
    const phone = dto.phone.trim();
    const name = dto.name.trim();
    const roles = this.toUserRoles(dto.roles);
    const organizationIds = this.normalizeIdArray(
      dto.organizationIds,
      'organizationIds',
    );
    const disciplineIds = this.normalizeIdArray(
      dto.disciplineIds,
      'disciplineIds',
    );

    await this.assertUniquePhone(phone);
    await this.assertActiveOrganizations(organizationIds);
    await this.assertActiveDisciplineNodes(disciplineIds);

    try {
      const user = await this.userModel.create({
        phone,
        name,
        roles,
        passwordHash: await hash(dto.password ?? phone, 12),
        organizationIds: this.toObjectIdArray(
          organizationIds,
          'organizationIds',
        ),
        disciplineIds: this.toObjectIdArray(disciplineIds, 'disciplineIds'),
        isActive: dto.isActive ?? true,
        mustChangePassword: dto.mustChangePassword ?? true,
        status: 'active',
      });

      return this.toAdminUserResponse(user.toObject<PublicUserLean>());
    } catch (error) {
      if (this.isDuplicateKeyError(error)) {
        throw new ConflictException('User phone already exists');
      }

      throw error;
    }
  }

  async findAdminUserById(id: string): Promise<AdminUserResponse> {
    return this.toAdminUserResponse(await this.findAdminUserLeanById(id));
  }

  async updateAdminUser(
    id: string,
    dto: UpdateAdminUserDto,
    currentUser: AuthenticatedUser,
  ): Promise<AdminUserResponse> {
    if (dto.password !== undefined || dto.passwordHash !== undefined) {
      throw new BadRequestException(
        'Use reset-password endpoint to update password',
      );
    }

    const current = await this.findAdminUserLeanById(id);
    const nextRoles = dto.roles ? this.toUserRoles(dto.roles) : current.roles;
    const nextIsActive = dto.isActive ?? current.isActive ?? true;

    await this.assertAdminSelfAndLastAdminProtection(
      current,
      nextRoles,
      nextIsActive,
      currentUser,
    );

    const update: Record<string, unknown> = {};

    if (dto.name !== undefined) {
      update.name = dto.name.trim();
    }

    if (dto.roles !== undefined) {
      update.roles = nextRoles;
    }

    if (dto.isActive !== undefined) {
      update.isActive = dto.isActive;
    }

    if (dto.organizationIds !== undefined) {
      const organizationIds = this.normalizeIdArray(
        dto.organizationIds,
        'organizationIds',
      );
      await this.assertActiveOrganizations(organizationIds);
      update.organizationIds = this.toObjectIdArray(
        organizationIds,
        'organizationIds',
      );
    }

    if (dto.disciplineIds !== undefined) {
      const disciplineIds = this.normalizeIdArray(
        dto.disciplineIds,
        'disciplineIds',
      );
      await this.assertActiveDisciplineNodes(disciplineIds);
      update.disciplineIds = this.toObjectIdArray(
        disciplineIds,
        'disciplineIds',
      );
    }

    if (dto.mustChangePassword !== undefined) {
      update.mustChangePassword = dto.mustChangePassword;
    }

    if (Object.keys(update).length === 0) {
      return this.toAdminUserResponse(current);
    }

    const user = await this.userModel
      .findByIdAndUpdate(
        current._id,
        { $set: update },
        { returnDocument: 'after' },
      )
      .lean<PublicUserLean | null>()
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.toAdminUserResponse(user);
  }

  async updateAdminUserStatus(
    id: string,
    dto: UpdateAdminUserStatusDto,
    currentUser: AuthenticatedUser,
  ): Promise<AdminUserResponse> {
    return this.updateAdminUser(id, { isActive: dto.isActive }, currentUser);
  }

  async resetAdminUserPassword(
    id: string,
    dto: ResetAdminUserPasswordDto,
  ): Promise<AdminUserResponse> {
    const current = await this.findAdminUserLeanById(id);
    const password = dto.password ?? current.phone;
    const user = await this.userModel
      .findByIdAndUpdate(
        current._id,
        {
          $set: {
            passwordHash: await hash(password, 12),
            mustChangePassword: dto.mustChangePassword ?? true,
          },
        },
        { returnDocument: 'after' },
      )
      .lean<PublicUserLean | null>()
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.toAdminUserResponse(user);
  }

  async changeOwnPassword(input: {
    userId: string;
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<PublicUser> {
    if (!Types.ObjectId.isValid(input.userId)) {
      throw new UnauthorizedException();
    }

    const user = await this.userModel
      .findById(input.userId)
      .select('+passwordHash')
      .lean<ChangeOwnPasswordUserLean | null>()
      .exec();

    if (!user || user.status !== 'active' || user.isActive === false) {
      throw new UnauthorizedException();
    }

    const isCurrentPasswordValid = await compare(
      input.currentPassword,
      user.passwordHash,
    );

    if (!isCurrentPasswordValid) {
      throw new BadRequestException('当前密码不正确');
    }

    if (input.newPassword !== input.confirmPassword) {
      throw new BadRequestException('两次输入的新密码不一致');
    }

    if (input.newPassword === input.currentPassword) {
      throw new BadRequestException('新密码不能与当前密码相同');
    }

    const updatedUser = await this.userModel
      .findByIdAndUpdate(
        user._id,
        {
          $set: {
            passwordHash: await hash(input.newPassword, 12),
            mustChangePassword: false,
          },
        },
        { returnDocument: 'after' },
      )
      .lean<PublicUserLean | null>()
      .exec();

    if (
      !updatedUser ||
      updatedUser.status !== 'active' ||
      updatedUser.isActive === false
    ) {
      throw new UnauthorizedException();
    }

    return this.toPublicUser(updatedUser);
  }

  async resetPasswordAfterVerifiedSms(input: {
    userId: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<void> {
    if (!Types.ObjectId.isValid(input.userId)) {
      throw new UnauthorizedException('验证码错误或已过期');
    }

    if (input.newPassword !== input.confirmPassword) {
      throw new BadRequestException('两次输入的新密码不一致');
    }

    const user = await this.userModel
      .findById(input.userId)
      .select('+passwordHash')
      .lean<ChangeOwnPasswordUserLean | null>()
      .exec();

    if (!user || user.status !== 'active' || user.isActive === false) {
      throw new UnauthorizedException('验证码错误或已过期');
    }

    const isSameAsCurrentPassword = await compare(
      input.newPassword,
      user.passwordHash,
    );

    if (isSameAsCurrentPassword) {
      throw new BadRequestException('新密码不能与当前密码相同');
    }

    const result = await this.userModel
      .updateOne(
        {
          _id: user._id,
          status: 'active',
          isActive: { $ne: false },
        },
        {
          $set: {
            passwordHash: await hash(input.newPassword, 12),
            mustChangePassword: false,
          },
        },
      )
      .exec();

    if (result.matchedCount === 0) {
      throw new UnauthorizedException('验证码错误或已过期');
    }
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

  private buildAdminUserFilter(
    query: QueryAdminUsersDto,
  ): Record<string, unknown> {
    const filter: Record<string, unknown> = {};

    if (query.role) {
      filter.roles = this.toUserRoles([query.role])[0];
    }

    if (query.isActive !== undefined) {
      filter.isActive = query.isActive;
    }

    if (query.organizationId) {
      filter.organizationIds = toObjectId(
        query.organizationId,
        'organizationId',
      );
    }

    if (query.disciplineId) {
      filter.disciplineIds = toObjectId(query.disciplineId, 'disciplineId');
    }

    if (query.keyword) {
      const keyword = new RegExp(escapeRegExp(query.keyword), 'i');
      filter.$or = [{ name: keyword }, { phone: keyword }];
    }

    return filter;
  }

  private async findAdminUserLeanById(id: string): Promise<PublicUserLean> {
    const user = await this.userModel
      .findById(toObjectId(id))
      .lean<PublicUserLean | null>()
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  private toUserRoles(roles: string[]): UserRole[] {
    if (roles.length === 0) {
      throw new BadRequestException('roles must contain at least one role');
    }

    const invalidRole = roles.find(
      (role) => !USER_ROLES.includes(role as UserRole),
    );

    if (invalidRole) {
      throw new BadRequestException('roles contains invalid role');
    }

    return roles as UserRole[];
  }

  private normalizeIdArray(
    values: string[] | undefined,
    fieldName: string,
  ): string[] {
    if (values === undefined) {
      return [];
    }

    if (!Array.isArray(values)) {
      throw new BadRequestException(`${fieldName} must be an array`);
    }

    return ensureUniqueStrings(values);
  }

  private toObjectIdArray(
    values: string[],
    fieldName: string,
  ): Types.ObjectId[] {
    return values.map((value) => toObjectId(value, fieldName));
  }

  private async assertActiveOrganizations(ids: string[]): Promise<void> {
    if (ids.length === 0) {
      return;
    }

    const objectIds = this.toObjectIdArray(ids, 'organizationIds');
    const count = await this.organizationModel
      .countDocuments({ _id: { $in: objectIds }, isActive: true })
      .exec();

    if (count !== objectIds.length) {
      throw new BadRequestException(
        'organizationIds must reference active organizations',
      );
    }
  }

  private async assertActiveDisciplineNodes(ids: string[]): Promise<void> {
    if (ids.length === 0) {
      return;
    }

    const objectIds = this.toObjectIdArray(ids, 'disciplineIds');
    const count = await this.treeDictionaryModel
      .countDocuments({
        _id: { $in: objectIds },
        treeType: 'discipline',
        isActive: true,
      })
      .exec();

    if (count !== objectIds.length) {
      throw new BadRequestException(
        'disciplineIds must reference active discipline nodes',
      );
    }
  }

  private async assertUniquePhone(
    phone: string,
    excludeId?: string,
  ): Promise<void> {
    const filter: Record<string, unknown> = { phone };

    if (excludeId) {
      filter._id = { $ne: toObjectId(excludeId) };
    }

    const duplicate = await this.userModel.exists(filter).exec();

    if (duplicate) {
      throw new ConflictException('User phone already exists');
    }
  }

  private async assertAdminSelfAndLastAdminProtection(
    current: PublicUserLean,
    nextRoles: UserRole[],
    nextIsActive: boolean,
    currentUser: AuthenticatedUser,
  ): Promise<void> {
    const targetUserId = current._id.toString();
    const isSelf = targetUserId === currentUser.user.id;

    if (isSelf && nextIsActive === false) {
      throw new ConflictException('Current admin cannot be disabled');
    }

    if (isSelf && !nextRoles.includes('admin')) {
      throw new ConflictException('Current admin cannot remove own admin role');
    }

    if (
      this.isEnabledAdmin(current) &&
      !this.isEnabledAdminState(current, nextRoles, nextIsActive)
    ) {
      const otherEnabledAdminCount = await this.userModel
        .countDocuments({
          _id: { $ne: current._id },
          roles: 'admin',
          isActive: { $ne: false },
          status: 'active',
        })
        .exec();

      if (otherEnabledAdminCount === 0) {
        throw new ConflictException('At least one active admin is required');
      }
    }
  }

  private isEnabledAdmin(user: PublicUserLean): boolean {
    return this.isEnabledAdminState(user, user.roles, user.isActive ?? true);
  }

  private isEnabledAdminState(
    user: PublicUserLean,
    roles: UserRole[],
    isActive: boolean,
  ): boolean {
    return (
      isActive !== false && user.status === 'active' && roles.includes('admin')
    );
  }

  private isDuplicateKeyError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: unknown }).code === 11000
    );
  }

  private toAdminUserResponse(user: PublicUserLean): AdminUserResponse {
    return {
      id: user._id.toString(),
      phone: user.phone,
      name: user.name,
      roles: user.roles,
      organizationIds: (user.organizationIds ?? []).map((id) => id.toString()),
      disciplineIds: (user.disciplineIds ?? []).map((id) => id.toString()),
      mustChangePassword: user.mustChangePassword ?? false,
      isActive: user.isActive ?? true,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
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
