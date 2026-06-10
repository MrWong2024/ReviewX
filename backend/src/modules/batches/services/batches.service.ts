import {
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
import { CreateBatchDto } from '../dto/create-batch.dto';
import { QueryBatchesDto } from '../dto/query-batches.dto';
import { UpdateBatchDto } from '../dto/update-batch.dto';
import { Batch } from '../schemas/batch.schema';

export type BatchResponse = {
  id: string;
  name: string;
  year?: number | null;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type BatchLean = TimestampFields & {
  _id: Types.ObjectId;
  name: string;
  year?: number | null;
  description?: string;
  isActive: boolean;
};

@Injectable()
export class BatchesService {
  constructor(
    @InjectModel(Batch.name) private readonly batchModel: Model<Batch>,
  ) {}

  async create(dto: CreateBatchDto): Promise<BatchResponse> {
    await this.assertUniqueName(dto.name);
    const batch = await this.batchModel.create(dto);
    return this.toResponse(batch.toObject<BatchLean>());
  }

  async list(
    query: QueryBatchesDto,
  ): Promise<PaginatedResponse<BatchResponse>> {
    const filter: Record<string, unknown> = {};

    if (query.isActive !== undefined) {
      filter.isActive = query.isActive;
    }

    if (query.keyword) {
      const keyword = new RegExp(escapeRegExp(query.keyword), 'i');
      filter.$or = [{ name: keyword }, { description: keyword }];
    }

    const [items, total] = await Promise.all([
      this.batchModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((query.page - 1) * query.pageSize)
        .limit(query.pageSize)
        .lean<BatchLean[]>()
        .exec(),
      this.batchModel.countDocuments(filter).exec(),
    ]);

    return {
      items: items.map((item) => this.toResponse(item)),
      page: query.page,
      pageSize: query.pageSize,
      total,
    };
  }

  async findById(id: string): Promise<BatchResponse> {
    const batch = await this.findLeanById(id);
    return this.toResponse(batch);
  }

  async existsById(id: string): Promise<boolean> {
    const objectId = toObjectId(id, 'batchId');
    const count = await this.batchModel
      .countDocuments({ _id: objectId })
      .exec();
    return count > 0;
  }

  async update(id: string, dto: UpdateBatchDto): Promise<BatchResponse> {
    toObjectId(id);

    if (dto.name) {
      await this.assertUniqueName(dto.name, id);
    }

    const batch = await this.batchModel
      .findByIdAndUpdate(id, { $set: dto }, { returnDocument: 'after' })
      .lean<BatchLean | null>()
      .exec();

    if (!batch) {
      throw new NotFoundException('Batch not found');
    }

    return this.toResponse(batch);
  }

  async remove(id: string): Promise<BatchResponse> {
    return this.update(id, { isActive: false });
  }

  private async assertUniqueName(
    name: string,
    excludeId?: string,
  ): Promise<void> {
    const filter: Record<string, unknown> = { name };

    if (excludeId) {
      filter._id = { $ne: toObjectId(excludeId) };
    }

    const exists = await this.batchModel.exists(filter).exec();

    if (exists) {
      throw new ConflictException('Batch name already exists');
    }
  }

  private async findLeanById(id: string): Promise<BatchLean> {
    const batch = await this.batchModel
      .findById(toObjectId(id))
      .lean<BatchLean | null>()
      .exec();

    if (!batch) {
      throw new NotFoundException('Batch not found');
    }

    return batch;
  }

  private toResponse(batch: BatchLean): BatchResponse {
    return {
      id: batch._id.toString(),
      name: batch.name,
      year: batch.year,
      description: batch.description,
      isActive: batch.isActive,
      createdAt: batch.createdAt,
      updatedAt: batch.updatedAt,
    };
  }
}
