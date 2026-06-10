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
import { CreateReviewSchemeDto } from '../dto/create-review-scheme.dto';
import { QueryReviewSchemesDto } from '../dto/query-review-schemes.dto';
import { ReviewSchemeItemDto } from '../dto/review-scheme-item.dto';
import { UpdateReviewSchemeDto } from '../dto/update-review-scheme.dto';
import { ReviewScheme } from '../schemas/review-scheme.schema';

export type ReviewSchemeItemResponse = {
  name: string;
  maxScore: number;
  scoringGuide?: string;
  sortOrder: number;
  suggestionRequiredThresholdRatio: number;
};

export type ReviewSchemeResponse = {
  id: string;
  name: string;
  description?: string;
  items: ReviewSchemeItemResponse[];
  totalScore: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type ReviewSchemeLean = TimestampFields & {
  _id: Types.ObjectId;
  name: string;
  description?: string;
  items: ReviewSchemeItemResponse[];
  totalScore: number;
  isActive: boolean;
};

@Injectable()
export class ReviewSchemesService {
  constructor(
    @InjectModel(ReviewScheme.name)
    private readonly reviewSchemeModel: Model<ReviewScheme>,
  ) {}

  async create(dto: CreateReviewSchemeDto): Promise<ReviewSchemeResponse> {
    await this.assertUniqueName(dto.name);
    const items = this.normalizeItems(dto.items);
    const scheme = await this.reviewSchemeModel.create({
      ...dto,
      items,
      totalScore: this.calculateTotalScore(items),
    });

    return this.toResponse(scheme.toObject<ReviewSchemeLean>());
  }

  async list(
    query: QueryReviewSchemesDto,
  ): Promise<PaginatedResponse<ReviewSchemeResponse>> {
    const filter: Record<string, unknown> = {};

    if (query.isActive !== undefined) {
      filter.isActive = query.isActive;
    }

    if (query.keyword) {
      const keyword = new RegExp(escapeRegExp(query.keyword), 'i');
      filter.$or = [{ name: keyword }, { description: keyword }];
    }

    const [items, total] = await Promise.all([
      this.reviewSchemeModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((query.page - 1) * query.pageSize)
        .limit(query.pageSize)
        .lean<ReviewSchemeLean[]>()
        .exec(),
      this.reviewSchemeModel.countDocuments(filter).exec(),
    ]);

    return {
      items: items.map((item) => this.toResponse(item)),
      page: query.page,
      pageSize: query.pageSize,
      total,
    };
  }

  async findById(id: string): Promise<ReviewSchemeResponse> {
    return this.toResponse(await this.findLeanById(id));
  }

  async findActiveById(id: string): Promise<ReviewSchemeResponse> {
    const scheme = await this.reviewSchemeModel
      .findOne({ _id: toObjectId(id, 'reviewSchemeId'), isActive: true })
      .lean<ReviewSchemeLean | null>()
      .exec();

    if (!scheme) {
      throw new NotFoundException('Active review scheme not found');
    }

    return this.toResponse(scheme);
  }

  async update(
    id: string,
    dto: UpdateReviewSchemeDto,
  ): Promise<ReviewSchemeResponse> {
    await this.findLeanById(id);

    if (dto.name) {
      await this.assertUniqueName(dto.name, id);
    }

    const update = {
      ...dto,
      ...(dto.items
        ? {
            items: this.normalizeItems(dto.items),
            totalScore: this.calculateTotalScore(dto.items),
          }
        : {}),
    };

    const scheme = await this.reviewSchemeModel
      .findByIdAndUpdate(id, { $set: update }, { returnDocument: 'after' })
      .lean<ReviewSchemeLean | null>()
      .exec();

    if (!scheme) {
      throw new NotFoundException('Review scheme not found');
    }

    return this.toResponse(scheme);
  }

  async remove(id: string): Promise<ReviewSchemeResponse> {
    return this.update(id, { isActive: false });
  }

  private normalizeItems(
    items: ReviewSchemeItemDto[],
  ): ReviewSchemeItemResponse[] {
    return items.map((item) => ({
      name: item.name,
      maxScore: item.maxScore,
      scoringGuide: item.scoringGuide,
      sortOrder: item.sortOrder ?? 0,
      suggestionRequiredThresholdRatio:
        item.suggestionRequiredThresholdRatio ?? 0.8,
    }));
  }

  private calculateTotalScore(items: { maxScore: number }[]): number {
    return items.reduce((sum, item) => sum + item.maxScore, 0);
  }

  private async assertUniqueName(
    name: string,
    excludeId?: string,
  ): Promise<void> {
    const filter: Record<string, unknown> = { name };

    if (excludeId) {
      filter._id = { $ne: toObjectId(excludeId) };
    }

    const duplicate = await this.reviewSchemeModel.exists(filter).exec();

    if (duplicate) {
      throw new ConflictException('Review scheme name already exists');
    }
  }

  private async findLeanById(id: string): Promise<ReviewSchemeLean> {
    const scheme = await this.reviewSchemeModel
      .findById(toObjectId(id))
      .lean<ReviewSchemeLean | null>()
      .exec();

    if (!scheme) {
      throw new NotFoundException('Review scheme not found');
    }

    return scheme;
  }

  private toResponse(scheme: ReviewSchemeLean): ReviewSchemeResponse {
    return {
      id: scheme._id.toString(),
      name: scheme.name,
      description: scheme.description,
      items: scheme.items,
      totalScore: scheme.totalScore,
      isActive: scheme.isActive,
      createdAt: scheme.createdAt,
      updatedAt: scheme.updatedAt,
    };
  }
}
