import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  TimestampFields,
  escapeRegExp,
  toObjectId,
} from '../../../common/utils/mongo-query';
import {
  PROJECT_IMPORT_FIELD_ALIASES,
  PROJECT_IMPORT_STANDARD_FIELDS,
  ProjectImportAliasMap,
  ProjectImportStandardField,
  ProjectImportStandardFieldMeta,
  getProjectImportStandardFieldMeta,
  isProjectImportStandardField,
  normalizeProjectImportFieldAlias,
} from '../constants/project-import-field-map';
import {
  ProjectImportFieldMappingResponse,
  ProjectImportFieldMappingsResponse,
  ProjectImportStandardFieldsResponse,
} from '../dto/project-import-field-mapping.response';
import { QueryProjectImportFieldMappingsDto } from '../dto/query-project-import-field-mappings.dto';
import { UpdateProjectImportFieldMappingDto } from '../dto/update-project-import-field-mapping.dto';
import { UpsertProjectImportFieldMappingDto } from '../dto/upsert-project-import-field-mapping.dto';
import { ProjectImportFieldMapping } from '../schemas/project-import-field-mapping.schema';

type ProjectImportFieldMappingLean = TimestampFields & {
  _id: Types.ObjectId;
  standardField: ProjectImportStandardField;
  aliases: string[];
  normalizedAliases: string[];
  isActive: boolean;
  description?: string;
  createdByUserId?: Types.ObjectId | null;
  updatedByUserId?: Types.ObjectId | null;
};

type ProjectImportFieldMappingConflictLean = {
  _id: Types.ObjectId;
  standardField: ProjectImportStandardField;
};

type NormalizedAliases = {
  aliases: string[];
  normalizedAliases: string[];
};

const STANDARD_FIELD_META = getProjectImportStandardFieldMeta();

@Injectable()
export class ProjectImportFieldMappingsService {
  constructor(
    @InjectModel(ProjectImportFieldMapping.name)
    private readonly fieldMappingModel: Model<ProjectImportFieldMapping>,
  ) {}

  listStandardFields(): ProjectImportStandardFieldsResponse {
    return {
      items: STANDARD_FIELD_META.map((item) => ({
        standardField: item.standardField,
        label: item.label,
        required: item.required,
        defaultAliases: [...item.defaultAliases],
      })),
    };
  }

  async list(
    query: QueryProjectImportFieldMappingsDto,
  ): Promise<ProjectImportFieldMappingsResponse> {
    const mappings = await this.fieldMappingModel
      .find()
      .lean<ProjectImportFieldMappingLean[]>()
      .exec();
    const mappingByField = new Map<
      ProjectImportStandardField,
      ProjectImportFieldMappingLean
    >();

    for (const mapping of mappings) {
      mappingByField.set(mapping.standardField, mapping);
    }

    const keyword = query.keyword?.trim();
    const items = STANDARD_FIELD_META.map((meta) =>
      this.toResponse(meta, mappingByField.get(meta.standardField)),
    ).filter((item) => this.matchesQuery(item, keyword, query.isActive));

    return { items };
  }

  async findByStandardField(
    standardField: string,
  ): Promise<ProjectImportFieldMappingResponse> {
    const field = this.assertStandardField(standardField);
    const mapping = await this.fieldMappingModel
      .findOne({ standardField: field })
      .lean<ProjectImportFieldMappingLean | null>()
      .exec();

    return this.toResponse(this.getMeta(field), mapping ?? undefined);
  }

  async upsert(
    standardField: string,
    dto: UpsertProjectImportFieldMappingDto,
    currentUserId: string,
  ): Promise<ProjectImportFieldMappingResponse> {
    const field = this.assertStandardField(standardField);
    const aliases = await this.prepareAliases(field, dto.aliases);
    const userObjectId = toObjectId(currentUserId, 'userId');

    try {
      const mapping = await this.fieldMappingModel
        .findOneAndUpdate(
          { standardField: field },
          {
            $set: {
              aliases: aliases.aliases,
              normalizedAliases: aliases.normalizedAliases,
              isActive: dto.isActive ?? true,
              description: dto.description?.trim() ?? '',
              updatedByUserId: userObjectId,
            },
            $setOnInsert: {
              standardField: field,
              createdByUserId: userObjectId,
            },
          },
          { upsert: true, returnDocument: 'after' },
        )
        .lean<ProjectImportFieldMappingLean | null>()
        .exec();

      if (!mapping) {
        throw new NotFoundException('字段映射配置不存在');
      }

      return this.toResponse(this.getMeta(field), mapping);
    } catch (error) {
      if (this.isDuplicateKeyError(error)) {
        throw new ConflictException('字段映射配置已存在');
      }

      throw error;
    }
  }

  async update(
    standardField: string,
    dto: UpdateProjectImportFieldMappingDto,
    currentUserId: string,
  ): Promise<ProjectImportFieldMappingResponse> {
    const field = this.assertStandardField(standardField);
    const current = await this.findConfiguredMapping(field);
    const update: Record<string, unknown> = {
      updatedByUserId: toObjectId(currentUserId, 'userId'),
    };

    if (dto.aliases !== undefined) {
      const aliases = await this.prepareAliases(field, dto.aliases);
      update.aliases = aliases.aliases;
      update.normalizedAliases = aliases.normalizedAliases;
    }

    if (dto.isActive !== undefined) {
      update.isActive = dto.isActive;
    }

    if (dto.description !== undefined) {
      update.description = dto.description.trim();
    }

    const mapping = await this.fieldMappingModel
      .findByIdAndUpdate(
        current._id,
        { $set: update },
        { returnDocument: 'after' },
      )
      .lean<ProjectImportFieldMappingLean | null>()
      .exec();

    if (!mapping) {
      throw new NotFoundException('字段映射配置不存在');
    }

    return this.toResponse(this.getMeta(field), mapping);
  }

  async remove(standardField: string): Promise<{ success: true }> {
    const field = this.assertStandardField(standardField);
    const deleted = await this.fieldMappingModel
      .findOneAndDelete({ standardField: field })
      .lean<ProjectImportFieldMappingLean | null>()
      .exec();

    if (!deleted) {
      throw new NotFoundException('字段映射配置不存在');
    }

    return { success: true };
  }

  async resetDefaults(
    standardField: string,
    currentUserId: string,
  ): Promise<ProjectImportFieldMappingResponse> {
    const field = this.assertStandardField(standardField);
    const aliases = await this.prepareAliases(
      field,
      PROJECT_IMPORT_FIELD_ALIASES[field],
    );
    const userObjectId = toObjectId(currentUserId, 'userId');

    try {
      const mapping = await this.fieldMappingModel
        .findOneAndUpdate(
          { standardField: field },
          {
            $set: {
              aliases: aliases.aliases,
              normalizedAliases: aliases.normalizedAliases,
              isActive: true,
              updatedByUserId: userObjectId,
            },
            $setOnInsert: {
              standardField: field,
              description: '',
              createdByUserId: userObjectId,
            },
          },
          { upsert: true, returnDocument: 'after' },
        )
        .lean<ProjectImportFieldMappingLean | null>()
        .exec();

      if (!mapping) {
        throw new NotFoundException('字段映射配置不存在');
      }

      return this.toResponse(this.getMeta(field), mapping);
    } catch (error) {
      if (this.isDuplicateKeyError(error)) {
        throw new ConflictException('字段映射配置已存在');
      }

      throw error;
    }
  }

  async getEffectiveAliasMap(): Promise<ProjectImportAliasMap> {
    const aliasMap = this.getDefaultAliasMap();
    const activeMappings = await this.fieldMappingModel
      .find({ isActive: true })
      .lean<ProjectImportFieldMappingLean[]>()
      .exec();

    for (const mapping of activeMappings) {
      aliasMap[mapping.standardField] = [...mapping.aliases];
    }

    return aliasMap;
  }

  private async findConfiguredMapping(
    standardField: ProjectImportStandardField,
  ): Promise<ProjectImportFieldMappingLean> {
    const mapping = await this.fieldMappingModel
      .findOne({ standardField })
      .lean<ProjectImportFieldMappingLean | null>()
      .exec();

    if (!mapping) {
      throw new NotFoundException('字段映射配置不存在');
    }

    return mapping;
  }

  private async prepareAliases(
    standardField: ProjectImportStandardField,
    aliases: string[],
  ): Promise<NormalizedAliases> {
    const normalized = this.normalizeAliases(aliases);
    await this.assertNoAliasConflict(
      standardField,
      normalized.normalizedAliases,
    );
    return normalized;
  }

  private normalizeAliases(aliases: string[]): NormalizedAliases {
    if (aliases.length === 0) {
      throw new BadRequestException('字段别名不能为空');
    }

    const cleanedAliases: string[] = [];
    const normalizedAliases: string[] = [];

    for (const alias of aliases) {
      const cleanedAlias = this.cleanAlias(alias);

      if (!cleanedAlias) {
        throw new BadRequestException('字段别名不能为空');
      }

      const normalizedAlias = normalizeProjectImportFieldAlias(cleanedAlias);
      cleanedAliases.push(cleanedAlias);
      normalizedAliases.push(normalizedAlias);
    }

    if (new Set(normalizedAliases).size !== normalizedAliases.length) {
      throw new BadRequestException('同一字段下存在重复别名');
    }

    return { aliases: cleanedAliases, normalizedAliases };
  }

  private cleanAlias(alias: string): string {
    return alias
      .replace(/\u3000/g, ' ')
      .trim()
      .replace(/\s+/g, ' ');
  }

  private async assertNoAliasConflict(
    standardField: ProjectImportStandardField,
    normalizedAliases: string[],
  ): Promise<void> {
    const configuredConflict = await this.fieldMappingModel
      .findOne({
        standardField: { $ne: standardField },
        normalizedAliases: { $in: normalizedAliases },
      })
      .select({ standardField: 1 })
      .lean<ProjectImportFieldMappingConflictLean | null>()
      .exec();

    if (configuredConflict) {
      throw new ConflictException('字段别名已被其他标准字段使用');
    }

    const reservedAliases = this.getReservedAliases(standardField);
    const hasReservedConflict = normalizedAliases.some((alias) =>
      reservedAliases.has(alias),
    );

    if (hasReservedConflict) {
      throw new ConflictException('字段别名已被其他标准字段使用');
    }
  }

  private getReservedAliases(
    standardField: ProjectImportStandardField,
  ): Set<string> {
    const aliases = new Set<string>();

    for (const field of PROJECT_IMPORT_STANDARD_FIELDS) {
      if (field === standardField) {
        continue;
      }

      aliases.add(normalizeProjectImportFieldAlias(field));

      for (const alias of PROJECT_IMPORT_FIELD_ALIASES[field]) {
        aliases.add(normalizeProjectImportFieldAlias(alias));
      }
    }

    return aliases;
  }

  private assertStandardField(value: string): ProjectImportStandardField {
    if (!isProjectImportStandardField(value)) {
      throw new BadRequestException('未知的导入标准字段');
    }

    return value;
  }

  private getMeta(
    standardField: ProjectImportStandardField,
  ): ProjectImportStandardFieldMeta {
    const meta = STANDARD_FIELD_META.find(
      (item) => item.standardField === standardField,
    );

    if (!meta) {
      throw new BadRequestException('未知的导入标准字段');
    }

    return meta;
  }

  private toResponse(
    meta: ProjectImportStandardFieldMeta,
    mapping: ProjectImportFieldMappingLean | undefined,
  ): ProjectImportFieldMappingResponse {
    const isConfigured = Boolean(mapping);
    const isActive = mapping?.isActive ?? true;
    const configuredAliases = mapping?.aliases ?? [];
    const effectiveAliases =
      isConfigured && isActive ? configuredAliases : meta.defaultAliases;

    return {
      id: mapping?._id.toString(),
      standardField: meta.standardField,
      label: meta.label,
      required: meta.required,
      aliases: [...configuredAliases],
      normalizedAliases: [...(mapping?.normalizedAliases ?? [])],
      defaultAliases: [...meta.defaultAliases],
      effectiveAliases: [...effectiveAliases],
      isConfigured,
      isActive,
      description: mapping?.description,
      createdByUserId: mapping?.createdByUserId?.toString(),
      updatedByUserId: mapping?.updatedByUserId?.toString(),
      createdAt: mapping?.createdAt,
      updatedAt: mapping?.updatedAt,
    };
  }

  private matchesQuery(
    item: ProjectImportFieldMappingResponse,
    keyword: string | undefined,
    isActive: boolean | undefined,
  ): boolean {
    if (isActive !== undefined && item.isActive !== isActive) {
      return false;
    }

    if (!keyword) {
      return true;
    }

    const keywordPattern = new RegExp(escapeRegExp(keyword), 'i');
    const values = [
      item.standardField,
      item.label,
      item.description ?? '',
      ...item.aliases,
      ...item.defaultAliases,
      ...item.effectiveAliases,
    ];

    return values.some((value) => keywordPattern.test(value));
  }

  private getDefaultAliasMap(): ProjectImportAliasMap {
    const aliasMap = {} as ProjectImportAliasMap;

    for (const field of PROJECT_IMPORT_STANDARD_FIELDS) {
      aliasMap[field] = [...PROJECT_IMPORT_FIELD_ALIASES[field]];
    }

    return aliasMap;
  }

  private isDuplicateKeyError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: unknown }).code === 11000
    );
  }
}
