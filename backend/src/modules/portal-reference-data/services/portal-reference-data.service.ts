import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  escapeRegExp,
  TimestampFields,
} from '../../../common/utils/mongo-query';
import { Batch } from '../../batches/schemas/batch.schema';
import { Dictionary } from '../../dictionaries/schemas/dictionary.schema';
import { Organization } from '../../organizations/schemas/organization.schema';
import { ReviewScheme } from '../../review-schemes/schemas/review-scheme.schema';
import { TreeDictionary } from '../../tree-dictionaries/schemas/tree-dictionary.schema';
import { User } from '../../users/schemas/user.schema';
import {
  PortalBatchSummary,
  PortalDictionarySummary,
  PortalListResponse,
  PortalOrganizationSummary,
  PortalReviewSchemeSummary,
  PortalTreeDictionarySummary,
  PortalUserSummary,
} from '../dto/portal-reference-data.response';
import { QueryPortalCommonDto } from '../dto/query-portal-common.dto';
import { QueryPortalDictionariesDto } from '../dto/query-portal-dictionaries.dto';
import { QueryPortalTreeDictionariesDto } from '../dto/query-portal-tree-dictionaries.dto';
import {
  PORTAL_USER_QUERY_ROLES,
  PortalUserQueryRole,
  QueryPortalUsersDto,
} from '../dto/query-portal-users.dto';

type DictionarySummaryLean = {
  _id: Types.ObjectId;
  dictType: string;
  code: string;
  name: string;
  sortOrder?: number;
  isActive?: boolean;
};

type TreeDictionarySummaryLean = {
  _id: Types.ObjectId;
  treeType: string;
  parentId?: Types.ObjectId | null;
  code?: string;
  name: string;
  sortOrder?: number;
  isActive?: boolean;
};

type BatchSummaryLean = TimestampFields & {
  _id: Types.ObjectId;
  name: string;
  isActive?: boolean;
};

type OrganizationSummaryLean = {
  _id: Types.ObjectId;
  name: string;
  regionId?: Types.ObjectId | null;
  isActive?: boolean;
};

type ReviewSchemeSummaryLean = {
  _id: Types.ObjectId;
  name: string;
  totalScore?: number;
  isActive?: boolean;
};

type UserSummaryLean = {
  _id: Types.ObjectId;
  name: string;
  phone?: string;
  roles?: string[];
  organizationIds?: Types.ObjectId[];
  disciplineIds?: Types.ObjectId[];
  isActive?: boolean;
};

@Injectable()
export class PortalReferenceDataService {
  constructor(
    @InjectModel(Dictionary.name)
    private readonly dictionaryModel: Model<Dictionary>,
    @InjectModel(TreeDictionary.name)
    private readonly treeDictionaryModel: Model<TreeDictionary>,
    @InjectModel(Batch.name)
    private readonly batchModel: Model<Batch>,
    @InjectModel(Organization.name)
    private readonly organizationModel: Model<Organization>,
    @InjectModel(ReviewScheme.name)
    private readonly reviewSchemeModel: Model<ReviewScheme>,
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
  ) {}

  async listDictionaries(
    query: QueryPortalDictionariesDto,
  ): Promise<PortalListResponse<PortalDictionarySummary>> {
    const filter: Record<string, unknown> = this.buildActiveFilter(query);
    const dictTypes = this.resolveUniqueValues(query.dictType, query.dictTypes);

    if (dictTypes.length > 0) {
      filter.dictType = { $in: dictTypes };
    }

    if (query.keyword) {
      const keyword = this.toKeywordRegex(query.keyword);
      filter.$or = [{ code: keyword }, { name: keyword }];
    }

    const items = await this.dictionaryModel
      .find(filter)
      .select({
        dictType: 1,
        code: 1,
        name: 1,
        sortOrder: 1,
        isActive: 1,
      })
      .sort({ dictType: 1, sortOrder: 1, name: 1 })
      .lean<DictionarySummaryLean[]>()
      .exec();

    return { items: items.map((item) => this.toDictionarySummary(item)) };
  }

  async listTreeDictionaries(
    query: QueryPortalTreeDictionariesDto,
  ): Promise<PortalListResponse<PortalTreeDictionarySummary>> {
    const filter: Record<string, unknown> = this.buildActiveFilter(query);
    const treeTypes = this.resolveUniqueValues(query.treeType, query.treeTypes);

    if (treeTypes.length > 0) {
      filter.treeType = { $in: treeTypes };
    }

    if (query.keyword) {
      const keyword = this.toKeywordRegex(query.keyword);
      filter.$or = [{ code: keyword }, { name: keyword }];
    }

    const items = await this.treeDictionaryModel
      .find(filter)
      .select({
        treeType: 1,
        parentId: 1,
        code: 1,
        name: 1,
        sortOrder: 1,
        isActive: 1,
      })
      .sort({ treeType: 1, sortOrder: 1, name: 1 })
      .lean<TreeDictionarySummaryLean[]>()
      .exec();

    return { items: items.map((item) => this.toTreeDictionarySummary(item)) };
  }

  async listBatches(
    query: QueryPortalCommonDto,
  ): Promise<PortalListResponse<PortalBatchSummary>> {
    const filter: Record<string, unknown> = this.buildActiveFilter(query);

    if (query.keyword) {
      filter.name = this.toKeywordRegex(query.keyword);
    }

    const items = await this.batchModel
      .find(filter)
      .select({ name: 1, isActive: 1, createdAt: 1, updatedAt: 1 })
      .sort({ name: -1, createdAt: -1 })
      .lean<BatchSummaryLean[]>()
      .exec();

    return { items: items.map((item) => this.toBatchSummary(item)) };
  }

  async listOrganizations(
    query: QueryPortalCommonDto,
  ): Promise<PortalListResponse<PortalOrganizationSummary>> {
    const filter: Record<string, unknown> = this.buildActiveFilter(query);

    if (query.keyword) {
      const keyword = this.toKeywordRegex(query.keyword);
      filter.$or = [
        { name: keyword },
        { contactName: keyword },
        { contactPhone: keyword },
      ];
    }

    const items = await this.organizationModel
      .find(filter)
      .select({ name: 1, regionId: 1, isActive: 1 })
      .sort({ name: 1 })
      .lean<OrganizationSummaryLean[]>()
      .exec();

    return { items: items.map((item) => this.toOrganizationSummary(item)) };
  }

  async listReviewSchemes(
    query: QueryPortalCommonDto,
  ): Promise<PortalListResponse<PortalReviewSchemeSummary>> {
    const filter: Record<string, unknown> = this.buildActiveFilter(query);

    if (query.keyword) {
      filter.name = this.toKeywordRegex(query.keyword);
    }

    const items = await this.reviewSchemeModel
      .find(filter)
      .select({ name: 1, totalScore: 1, isActive: 1 })
      .sort({ name: 1 })
      .lean<ReviewSchemeSummaryLean[]>()
      .exec();

    return { items: items.map((item) => this.toReviewSchemeSummary(item)) };
  }

  async listUsers(
    query: QueryPortalUsersDto,
  ): Promise<PortalListResponse<PortalUserSummary>> {
    const roles = this.resolvePortalUserRoles(query);
    const filter: Record<string, unknown> = {
      ...this.buildActiveFilter(query),
      roles: { $in: roles, $nin: ['admin'] },
      status: 'active',
    };

    if (query.keyword) {
      const keyword = this.toKeywordRegex(query.keyword);
      filter.$or = [{ name: keyword }, { phone: keyword }];
    }

    const items = await this.userModel
      .find(filter)
      .select({
        name: 1,
        phone: 1,
        roles: 1,
        organizationIds: 1,
        disciplineIds: 1,
        isActive: 1,
      })
      .sort({ name: 1, phone: 1 })
      .lean<UserSummaryLean[]>()
      .exec();

    return { items: items.map((item) => this.toUserSummary(item)) };
  }

  private buildActiveFilter(query: QueryPortalCommonDto): {
    isActive: boolean;
  } {
    return { isActive: query.isActive ?? true };
  }

  private resolveUniqueValues(
    singleValue?: string,
    multipleValues?: string[],
  ): string[] {
    const values = [
      ...(singleValue ? [singleValue] : []),
      ...(multipleValues ?? []),
    ]
      .map((value) => value.trim())
      .filter(Boolean);

    return [...new Set(values)];
  }

  private resolvePortalUserRoles(
    query: QueryPortalUsersDto,
  ): PortalUserQueryRole[] {
    const roles = this.resolveUniqueValues(query.role, query.roles);

    if (roles.length === 0) {
      throw new BadRequestException('role or roles is required');
    }

    const invalidRole = roles.find((role) => !this.isPortalUserQueryRole(role));

    if (invalidRole) {
      throw new BadRequestException(
        'role must be one of review_manager, expert, project_owner',
      );
    }

    return roles.filter((role): role is PortalUserQueryRole =>
      this.isPortalUserQueryRole(role),
    );
  }

  private isPortalUserQueryRole(role: string): role is PortalUserQueryRole {
    return PORTAL_USER_QUERY_ROLES.includes(role as PortalUserQueryRole);
  }

  private toKeywordRegex(keyword: string): RegExp {
    return new RegExp(escapeRegExp(keyword), 'i');
  }

  private toDictionarySummary(
    dictionary: DictionarySummaryLean,
  ): PortalDictionarySummary {
    return {
      id: dictionary._id.toString(),
      dictType: dictionary.dictType,
      code: dictionary.code,
      name: dictionary.name,
      sortOrder: dictionary.sortOrder ?? 0,
      isActive: dictionary.isActive ?? true,
    };
  }

  private toTreeDictionarySummary(
    node: TreeDictionarySummaryLean,
  ): PortalTreeDictionarySummary {
    return {
      id: node._id.toString(),
      treeType: node.treeType,
      parentId: node.parentId?.toString() ?? null,
      code: node.code ?? '',
      name: node.name,
      sortOrder: node.sortOrder ?? 0,
      isActive: node.isActive ?? true,
    };
  }

  private toBatchSummary(batch: BatchSummaryLean): PortalBatchSummary {
    return {
      id: batch._id.toString(),
      name: batch.name,
      isActive: batch.isActive ?? true,
      createdAt: batch.createdAt.toISOString(),
      updatedAt: batch.updatedAt.toISOString(),
    };
  }

  private toOrganizationSummary(
    organization: OrganizationSummaryLean,
  ): PortalOrganizationSummary {
    return {
      id: organization._id.toString(),
      name: organization.name,
      regionId: organization.regionId?.toString() ?? null,
      isActive: organization.isActive ?? true,
    };
  }

  private toReviewSchemeSummary(
    scheme: ReviewSchemeSummaryLean,
  ): PortalReviewSchemeSummary {
    return {
      id: scheme._id.toString(),
      name: scheme.name,
      totalScore: scheme.totalScore,
      isActive: scheme.isActive ?? true,
    };
  }

  private toUserSummary(user: UserSummaryLean): PortalUserSummary {
    return {
      id: user._id.toString(),
      name: user.name,
      phone: user.phone,
      roles: user.roles ?? [],
      organizationIds: this.toStringArray(user.organizationIds),
      disciplineIds: this.toStringArray(user.disciplineIds),
      isActive: user.isActive ?? true,
    };
  }

  private toStringArray(values?: Types.ObjectId[]): string[] {
    return (values ?? []).map((value) => value.toString());
  }
}
