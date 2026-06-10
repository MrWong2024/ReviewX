import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  escapeRegExp,
  TimestampFields,
  toObjectId,
} from '../../../common/utils/mongo-query';
import { CreateTreeDictionaryDto } from '../dto/create-tree-dictionary.dto';
import { QueryTreeDictionariesDto } from '../dto/query-tree-dictionaries.dto';
import { UpdateTreeDictionaryDto } from '../dto/update-tree-dictionary.dto';
import { TreeDictionary } from '../schemas/tree-dictionary.schema';

export type TreeDictionaryResponse = {
  id: string;
  treeType: string;
  parentId?: string | null;
  code?: string;
  name: string;
  fullName?: string;
  pathIds: string[];
  level: number;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type TreeDictionaryLean = TimestampFields & {
  _id: Types.ObjectId;
  treeType: string;
  parentId?: Types.ObjectId | null;
  code?: string;
  name: string;
  fullName?: string;
  pathIds: Types.ObjectId[];
  level: number;
  sortOrder: number;
  isActive: boolean;
};

@Injectable()
export class TreeDictionariesService {
  constructor(
    @InjectModel(TreeDictionary.name)
    private readonly treeDictionaryModel: Model<TreeDictionary>,
  ) {}

  async create(dto: CreateTreeDictionaryDto): Promise<TreeDictionaryResponse> {
    const hierarchy = await this.resolveHierarchy(dto.treeType, dto.parentId);
    await this.assertUniqueName(dto.treeType, hierarchy.parentId, dto.name);

    const node = await this.treeDictionaryModel.create({
      ...dto,
      parentId: hierarchy.parentId,
      pathIds: hierarchy.pathIds,
      level: hierarchy.level,
    });

    return this.toResponse(node.toObject<TreeDictionaryLean>());
  }

  async list(
    query: QueryTreeDictionariesDto,
  ): Promise<TreeDictionaryResponse[]> {
    const filter: Record<string, unknown> = {};

    if (query.treeType) {
      filter.treeType = query.treeType;
    }

    if (query.parentId !== undefined) {
      filter.parentId = query.parentId ? toObjectId(query.parentId) : null;
    }

    if (query.isActive !== undefined) {
      filter.isActive = query.isActive;
    }

    if (query.keyword) {
      const keyword = new RegExp(escapeRegExp(query.keyword), 'i');
      filter.$or = [
        { code: keyword },
        { name: keyword },
        { fullName: keyword },
      ];
    }

    const items = await this.treeDictionaryModel
      .find(filter)
      .sort({ treeType: 1, level: 1, sortOrder: 1, name: 1, createdAt: 1 })
      .lean<TreeDictionaryLean[]>()
      .exec();

    return items.map((item) => this.toResponse(item));
  }

  async findById(id: string): Promise<TreeDictionaryResponse> {
    return this.toResponse(await this.findLeanById(id));
  }

  async findByIdAndType(
    id: string,
    treeType: string,
  ): Promise<TreeDictionaryResponse> {
    const node = await this.treeDictionaryModel
      .findOne({ _id: toObjectId(id), treeType })
      .lean<TreeDictionaryLean | null>()
      .exec();

    if (!node) {
      throw new NotFoundException(`${treeType} tree node not found`);
    }

    return this.toResponse(node);
  }

  async update(
    id: string,
    dto: UpdateTreeDictionaryDto,
  ): Promise<TreeDictionaryResponse> {
    const current = await this.findLeanById(id);
    const nextTreeType = dto.treeType ?? current.treeType;
    const nextParentInput =
      dto.parentId === undefined
        ? current.parentId?.toString()
        : dto.parentId || null;

    if (nextParentInput === id) {
      throw new BadRequestException('parentId must not equal current node id');
    }

    if (nextParentInput) {
      const descendant = await this.treeDictionaryModel
        .exists({ _id: toObjectId(nextParentInput), pathIds: toObjectId(id) })
        .exec();

      if (descendant) {
        throw new BadRequestException('parentId must not be a descendant node');
      }
    }

    const hierarchy = await this.resolveHierarchy(
      nextTreeType,
      nextParentInput,
    );
    const nextName = dto.name ?? current.name;
    await this.assertUniqueName(nextTreeType, hierarchy.parentId, nextName, id);

    const update = {
      ...dto,
      treeType: nextTreeType,
      parentId: hierarchy.parentId,
      pathIds: hierarchy.pathIds,
      level: hierarchy.level,
    };

    const node = await this.treeDictionaryModel
      .findByIdAndUpdate(id, { $set: update }, { returnDocument: 'after' })
      .lean<TreeDictionaryLean | null>()
      .exec();

    if (!node) {
      throw new NotFoundException('Tree dictionary node not found');
    }

    return this.toResponse(node);
  }

  async remove(id: string): Promise<TreeDictionaryResponse> {
    const node = await this.findLeanById(id);
    const childCount = await this.treeDictionaryModel
      .countDocuments({ parentId: node._id })
      .exec();

    if (childCount > 0) {
      throw new ConflictException('Tree node has child nodes');
    }

    return this.update(id, { isActive: false });
  }

  private async resolveHierarchy(
    treeType: string,
    parentIdInput?: string | null,
  ): Promise<{
    parentId: Types.ObjectId | null;
    pathIds: Types.ObjectId[];
    level: number;
  }> {
    if (!parentIdInput) {
      return { parentId: null, pathIds: [], level: 1 };
    }

    const parent = await this.treeDictionaryModel
      .findById(toObjectId(parentIdInput, 'parentId'))
      .lean<TreeDictionaryLean | null>()
      .exec();

    if (!parent) {
      throw new BadRequestException('parentId does not exist');
    }

    if (parent.treeType !== treeType) {
      throw new BadRequestException('parentId treeType does not match');
    }

    return {
      parentId: parent._id,
      pathIds: [...parent.pathIds, parent._id],
      level: parent.level + 1,
    };
  }

  private async assertUniqueName(
    treeType: string,
    parentId: Types.ObjectId | null,
    name: string,
    excludeId?: string,
  ): Promise<void> {
    const filter: Record<string, unknown> = { treeType, parentId, name };

    if (excludeId) {
      filter._id = { $ne: toObjectId(excludeId) };
    }

    const duplicate = await this.treeDictionaryModel.exists(filter).exec();

    if (duplicate) {
      throw new ConflictException('Tree node name already exists');
    }
  }

  private async findLeanById(id: string): Promise<TreeDictionaryLean> {
    const node = await this.treeDictionaryModel
      .findById(toObjectId(id))
      .lean<TreeDictionaryLean | null>()
      .exec();

    if (!node) {
      throw new NotFoundException('Tree dictionary node not found');
    }

    return node;
  }

  private toResponse(node: TreeDictionaryLean): TreeDictionaryResponse {
    return {
      id: node._id.toString(),
      treeType: node.treeType,
      parentId: node.parentId?.toString() ?? null,
      code: node.code,
      name: node.name,
      fullName: node.fullName,
      pathIds: node.pathIds.map((pathId) => pathId.toString()),
      level: node.level,
      sortOrder: node.sortOrder,
      isActive: node.isActive,
      createdAt: node.createdAt,
      updatedAt: node.updatedAt,
    };
  }
}
