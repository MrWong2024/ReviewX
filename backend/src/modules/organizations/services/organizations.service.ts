import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PaginatedResponse } from '../../../common/dto/pagination-query.dto';
import {
  escapeRegExp,
  TimestampFields,
  toObjectId,
} from '../../../common/utils/mongo-query';
import { TreeDictionariesService } from '../../tree-dictionaries/services/tree-dictionaries.service';
import { CreateOrganizationDto } from '../dto/create-organization.dto';
import { QueryOrganizationsDto } from '../dto/query-organizations.dto';
import { UpdateOrganizationDto } from '../dto/update-organization.dto';
import { Organization } from '../schemas/organization.schema';

const ADMINISTRATIVE_DIVISION_TREE_TYPE = 'administrative_division';

export type OrganizationResponse = {
  id: string;
  name: string;
  contactName?: string;
  contactPhone?: string;
  regionId?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type OrganizationLean = TimestampFields & {
  _id: Types.ObjectId;
  name: string;
  contactName?: string;
  contactPhone?: string;
  regionId?: Types.ObjectId | null;
  isActive: boolean;
};

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectModel(Organization.name)
    private readonly organizationModel: Model<Organization>,
    private readonly treeDictionariesService: TreeDictionariesService,
  ) {}

  async create(dto: CreateOrganizationDto): Promise<OrganizationResponse> {
    await this.assertUniqueName(dto.name);
    await this.assertRegion(dto.regionId);

    const organization = await this.organizationModel.create({
      ...dto,
      regionId: dto.regionId ? toObjectId(dto.regionId, 'regionId') : null,
    });

    return this.toResponse(organization.toObject<OrganizationLean>());
  }

  async list(
    query: QueryOrganizationsDto,
  ): Promise<PaginatedResponse<OrganizationResponse>> {
    const filter: Record<string, unknown> = {};

    if (query.regionId) {
      filter.regionId = toObjectId(query.regionId, 'regionId');
    }

    if (query.isActive !== undefined) {
      filter.isActive = query.isActive;
    }

    if (query.keyword) {
      const keyword = new RegExp(escapeRegExp(query.keyword), 'i');
      filter.$or = [
        { name: keyword },
        { contactName: keyword },
        { contactPhone: keyword },
      ];
    }

    const [items, total] = await Promise.all([
      this.organizationModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((query.page - 1) * query.pageSize)
        .limit(query.pageSize)
        .lean<OrganizationLean[]>()
        .exec(),
      this.organizationModel.countDocuments(filter).exec(),
    ]);

    return {
      items: items.map((item) => this.toResponse(item)),
      page: query.page,
      pageSize: query.pageSize,
      total,
    };
  }

  async findById(id: string): Promise<OrganizationResponse> {
    return this.toResponse(await this.findLeanById(id));
  }

  async assertAllExist(ids: string[]): Promise<void> {
    const objectIds = ids.map((id) => toObjectId(id, 'organizationId'));
    const count = await this.organizationModel
      .countDocuments({ _id: { $in: objectIds } })
      .exec();

    if (count !== objectIds.length) {
      throw new NotFoundException('Organization not found');
    }
  }

  async update(
    id: string,
    dto: UpdateOrganizationDto,
  ): Promise<OrganizationResponse> {
    await this.findLeanById(id);

    if (dto.name) {
      await this.assertUniqueName(dto.name, id);
    }

    await this.assertRegion(dto.regionId);

    const update = {
      ...dto,
      ...(dto.regionId !== undefined
        ? {
            regionId: dto.regionId
              ? toObjectId(dto.regionId, 'regionId')
              : null,
          }
        : {}),
    };

    const organization = await this.organizationModel
      .findByIdAndUpdate(id, { $set: update }, { returnDocument: 'after' })
      .lean<OrganizationLean | null>()
      .exec();

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return this.toResponse(organization);
  }

  async remove(id: string): Promise<OrganizationResponse> {
    return this.update(id, { isActive: false });
  }

  private async assertRegion(regionId?: string | null): Promise<void> {
    if (!regionId) {
      return;
    }

    try {
      await this.treeDictionariesService.findByIdAndType(
        regionId,
        ADMINISTRATIVE_DIVISION_TREE_TYPE,
      );
    } catch {
      throw new BadRequestException(
        'regionId must reference an administrative division node',
      );
    }
  }

  private async assertUniqueName(
    name: string,
    excludeId?: string,
  ): Promise<void> {
    const filter: Record<string, unknown> = { name };

    if (excludeId) {
      filter._id = { $ne: toObjectId(excludeId) };
    }

    const duplicate = await this.organizationModel.exists(filter).exec();

    if (duplicate) {
      throw new ConflictException('Organization name already exists');
    }
  }

  private async findLeanById(id: string): Promise<OrganizationLean> {
    const organization = await this.organizationModel
      .findById(toObjectId(id))
      .lean<OrganizationLean | null>()
      .exec();

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return organization;
  }

  private toResponse(organization: OrganizationLean): OrganizationResponse {
    return {
      id: organization._id.toString(),
      name: organization.name,
      contactName: organization.contactName,
      contactPhone: organization.contactPhone,
      regionId: organization.regionId?.toString() ?? null,
      isActive: organization.isActive,
      createdAt: organization.createdAt,
      updatedAt: organization.updatedAt,
    };
  }
}
