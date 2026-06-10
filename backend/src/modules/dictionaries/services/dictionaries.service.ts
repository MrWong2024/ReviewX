import {
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
import { CreateDictionaryDto } from '../dto/create-dictionary.dto';
import { QueryDictionariesDto } from '../dto/query-dictionaries.dto';
import { UpdateDictionaryDto } from '../dto/update-dictionary.dto';
import { Dictionary } from '../schemas/dictionary.schema';

export type DictionaryResponse = {
  id: string;
  dictType: string;
  code: string;
  name: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type DictionaryLean = TimestampFields & {
  _id: Types.ObjectId;
  dictType: string;
  code: string;
  name: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
};

@Injectable()
export class DictionariesService {
  constructor(
    @InjectModel(Dictionary.name)
    private readonly dictionaryModel: Model<Dictionary>,
  ) {}

  async create(dto: CreateDictionaryDto): Promise<DictionaryResponse> {
    await this.assertUnique(dto.dictType, dto.code, dto.name);
    const dictionary = await this.dictionaryModel.create(dto);
    return this.toResponse(dictionary.toObject<DictionaryLean>());
  }

  async list(query: QueryDictionariesDto): Promise<DictionaryResponse[]> {
    const filter: Record<string, unknown> = {};

    if (query.dictType) {
      filter.dictType = query.dictType;
    }

    if (query.isActive !== undefined) {
      filter.isActive = query.isActive;
    }

    if (query.keyword) {
      const keyword = new RegExp(escapeRegExp(query.keyword), 'i');
      filter.$or = [{ code: keyword }, { name: keyword }];
    }

    const items = await this.dictionaryModel
      .find(filter)
      .sort({ dictType: 1, sortOrder: 1, name: 1, createdAt: 1 })
      .lean<DictionaryLean[]>()
      .exec();

    return items.map((item) => this.toResponse(item));
  }

  async findById(id: string): Promise<DictionaryResponse> {
    return this.toResponse(await this.findLeanById(id));
  }

  async findByIdAndType(
    id: string,
    dictType: string,
  ): Promise<DictionaryResponse> {
    const dictionary = await this.dictionaryModel
      .findOne({ _id: toObjectId(id), dictType })
      .lean<DictionaryLean | null>()
      .exec();

    if (!dictionary) {
      throw new NotFoundException(`${dictType} dictionary not found`);
    }

    return this.toResponse(dictionary);
  }

  async update(
    id: string,
    dto: UpdateDictionaryDto,
  ): Promise<DictionaryResponse> {
    const current = await this.findLeanById(id);
    const nextDictType = dto.dictType ?? current.dictType;
    const nextCode = dto.code ?? current.code;
    const nextName = dto.name ?? current.name;

    await this.assertUnique(nextDictType, nextCode, nextName, id);

    const dictionary = await this.dictionaryModel
      .findByIdAndUpdate(id, { $set: dto }, { returnDocument: 'after' })
      .lean<DictionaryLean | null>()
      .exec();

    if (!dictionary) {
      throw new NotFoundException('Dictionary not found');
    }

    return this.toResponse(dictionary);
  }

  async remove(id: string): Promise<DictionaryResponse> {
    return this.update(id, { isActive: false });
  }

  private async assertUnique(
    dictType: string,
    code: string,
    name: string,
    excludeId?: string,
  ): Promise<void> {
    const exclusion = excludeId ? { _id: { $ne: toObjectId(excludeId) } } : {};
    const duplicate = await this.dictionaryModel
      .exists({
        ...exclusion,
        dictType,
        $or: [{ code }, { name }],
      })
      .exec();

    if (duplicate) {
      throw new ConflictException('Dictionary code or name already exists');
    }
  }

  private async findLeanById(id: string): Promise<DictionaryLean> {
    const dictionary = await this.dictionaryModel
      .findById(toObjectId(id))
      .lean<DictionaryLean | null>()
      .exec();

    if (!dictionary) {
      throw new NotFoundException('Dictionary not found');
    }

    return dictionary;
  }

  private toResponse(dictionary: DictionaryLean): DictionaryResponse {
    return {
      id: dictionary._id.toString(),
      dictType: dictionary.dictType,
      code: dictionary.code,
      name: dictionary.name,
      description: dictionary.description,
      sortOrder: dictionary.sortOrder,
      isActive: dictionary.isActive,
      createdAt: dictionary.createdAt,
      updatedAt: dictionary.updatedAt,
    };
  }
}
