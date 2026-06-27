import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { TimestampFields, toObjectId } from '../../../common/utils/mongo-query';
import { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import { Dictionary } from '../../dictionaries/schemas/dictionary.schema';
import { ExpertReviewsService } from '../../expert-reviews/services/expert-reviews.service';
import { ReviewSchemeSnapshot } from '../../expert-reviews/services/expert-reviews.service';
import { Project } from '../../projects/schemas/project.schema';
import { User } from '../../users/schemas/user.schema';
import { ConfirmConsensusReviewDto } from '../dto/confirm-consensus-review.dto';
import { GenerateConsensusDraftDto } from '../dto/generate-consensus-draft.dto';
import {
  REVIEW_LEVEL_DICT_TYPE,
  ConsensusDraftSource,
  ConsensusReviewStatus,
} from '../constants/consensus-review.constants';
import { ConsensusReview } from '../schemas/consensus-review.schema';
import { buildRuleBasedConsensusOpinion } from '../utils/rule-based-consensus.util';

export type ConsensusReviewResponse = {
  id: string;
  projectId: string;
  reviewSchemeSnapshot: ReviewSchemeSnapshot;
  draftGeneratedAt?: Date | null;
  draftGeneratedByUserId?: string | null;
  draftSource: ConsensusDraftSource;
  draftOpinion?: string;
  draftScore?: number | null;
  finalOpinion?: string;
  finalScore?: number | null;
  finalLevel?: string;
  originalLevel?: string;
  confirmedByUserId?: string | null;
  confirmedByUser?: ConsensusUserSummary | null;
  confirmedAt?: Date | null;
  status: ConsensusReviewStatus;
  expertReviewStats: {
    expertCount: number;
    submittedCount: number;
    averageScore?: number | null;
    minScore?: number | null;
    maxScore?: number | null;
  };
  createdAt: Date;
  updatedAt: Date;
};

export type ConsensusUserSummary = {
  id: string;
  name: string;
  phone?: string | null;
};

type ProjectLean = {
  _id: Types.ObjectId;
  reviewManagerId?: Types.ObjectId | null;
  reviewSchemeSnapshot?: Record<string, unknown> | null;
  finalLevel?: string;
  originalLevel?: string;
  isActive: boolean;
};

type ConsensusReviewLean = TimestampFields & {
  _id: Types.ObjectId;
  projectId: Types.ObjectId;
  reviewSchemeSnapshot: Record<string, unknown>;
  draftGeneratedAt?: Date | null;
  draftGeneratedByUserId?: Types.ObjectId | null;
  draftSource: ConsensusDraftSource;
  draftOpinion?: string;
  draftScore?: number | null;
  finalOpinion?: string;
  finalScore?: number | null;
  finalLevel?: string;
  originalLevel?: string;
  confirmedByUserId?: Types.ObjectId | string | null;
  confirmedAt?: Date | null;
  status: ConsensusReviewStatus;
  expertReviewStats: {
    expertCount: number;
    submittedCount: number;
    averageScore?: number | null;
    minScore?: number | null;
    maxScore?: number | null;
  };
};

type DictionaryLean = {
  code: string;
  name: string;
};

type UserSummaryLean = {
  _id: Types.ObjectId;
  name: string;
  phone?: string | null;
};

@Injectable()
export class ConsensusReviewsService {
  constructor(
    @InjectModel(ConsensusReview.name)
    private readonly consensusReviewModel: Model<ConsensusReview>,
    @InjectModel(Project.name)
    private readonly projectModel: Model<Project>,
    @InjectModel(Dictionary.name)
    private readonly dictionaryModel: Model<Dictionary>,
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
    private readonly expertReviewsService: ExpertReviewsService,
  ) {}

  async generateDraft(
    projectId: string,
    dto: GenerateConsensusDraftDto,
    currentUser: AuthenticatedUser,
  ): Promise<ConsensusReviewResponse> {
    const project = await this.assertReviewManagerAccess(
      projectId,
      currentUser,
    );
    const snapshot = this.getProjectSnapshot(project);
    const existing = await this.findConsensus(project._id);

    if (existing?.status === 'confirmed') {
      throw new ConflictException(
        'Confirmed consensus review cannot be overwritten',
      );
    }

    if (existing?.status === 'draft' && dto.force !== true) {
      throw new ConflictException('Consensus draft already exists');
    }

    const submittedReviews =
      await this.expertReviewsService.getSubmittedReviewsForConsensus(
        projectId,
      );

    if (submittedReviews.length === 0) {
      throw new ConflictException('Submitted expert review is required');
    }

    const reviewSummary =
      await this.expertReviewsService.calculateReviewSummaryByObjectId(
        project._id,
      );
    const draftScore = reviewSummary.averageScore ?? 0;
    const draftOpinion = buildRuleBasedConsensusOpinion({
      submittedReviews,
      averageScore: draftScore,
    });
    const expertReviewStats = {
      expertCount: reviewSummary.assignedExpertCount,
      submittedCount: reviewSummary.submittedExpertCount,
      averageScore: reviewSummary.averageScore,
      minScore: reviewSummary.minScore,
      maxScore: reviewSummary.maxScore,
    };
    const update = {
      projectId: project._id,
      reviewSchemeSnapshot: snapshot,
      draftGeneratedAt: new Date(),
      draftGeneratedByUserId: toObjectId(currentUser.user.id, 'userId'),
      draftSource: 'rule_based' as const,
      draftOpinion,
      draftScore,
      status: 'draft' as const,
      expertReviewStats,
    };
    const saved = existing
      ? await this.consensusReviewModel
          .findByIdAndUpdate(
            existing._id,
            { $set: update },
            { returnDocument: 'after' },
          )
          .lean<ConsensusReviewLean | null>()
          .exec()
      : await this.consensusReviewModel
          .create(update)
          .then((created) => created.toObject<ConsensusReviewLean>());

    if (!saved) {
      throw new NotFoundException('Consensus review not found');
    }

    return this.toResponse(saved);
  }

  async getConsensus(
    projectId: string,
    currentUser: AuthenticatedUser,
  ): Promise<ConsensusReviewResponse> {
    const project = await this.assertReviewManagerAccess(
      projectId,
      currentUser,
    );
    return this.getConsensusByProject(project._id);
  }

  async getConsensusForAdmin(
    projectId: string,
  ): Promise<ConsensusReviewResponse> {
    const project = await this.findActiveProject(projectId);
    return this.getConsensusByProject(project._id);
  }

  async confirm(
    projectId: string,
    dto: ConfirmConsensusReviewDto,
    currentUser: AuthenticatedUser,
  ): Promise<ConsensusReviewResponse> {
    const project = await this.assertReviewManagerAccess(
      projectId,
      currentUser,
    );
    return this.confirmProjectConsensus(project, dto, currentUser);
  }

  async confirmForAdmin(
    projectId: string,
    dto: ConfirmConsensusReviewDto,
    currentUser: AuthenticatedUser,
  ): Promise<ConsensusReviewResponse> {
    const project = await this.findActiveProject(projectId);
    return this.confirmProjectConsensus(project, dto, currentUser);
  }

  private async confirmProjectConsensus(
    project: ProjectLean,
    dto: ConfirmConsensusReviewDto,
    currentUser: AuthenticatedUser,
  ): Promise<ConsensusReviewResponse> {
    const snapshot = this.getProjectSnapshot(project);
    const submittedReviews =
      await this.expertReviewsService.getSubmittedReviewsForConsensus(
        project._id.toString(),
      );

    if (submittedReviews.length === 0) {
      throw new ConflictException('Submitted expert review is required');
    }

    if (dto.finalScore < 0 || dto.finalScore > snapshot.totalScore) {
      throw new BadRequestException(
        `finalScore must be between 0 and ${snapshot.totalScore}`,
      );
    }

    const finalLevel = await this.normalizeFinalLevel(dto.finalLevel);
    const reviewSummary =
      await this.expertReviewsService.calculateReviewSummaryByObjectId(
        project._id,
      );
    const existing = await this.findConsensus(project._id);
    const confirmedAt = new Date();
    const update = {
      projectId: project._id,
      reviewSchemeSnapshot: existing?.reviewSchemeSnapshot ?? snapshot,
      finalOpinion: dto.finalOpinion,
      finalScore: dto.finalScore,
      finalLevel,
      originalLevel: existing?.originalLevel || finalLevel,
      confirmedByUserId: toObjectId(currentUser.user.id, 'userId'),
      confirmedAt,
      status: 'confirmed' as const,
      expertReviewStats: {
        expertCount: reviewSummary.assignedExpertCount,
        submittedCount: reviewSummary.submittedExpertCount,
        averageScore: reviewSummary.averageScore,
        minScore: reviewSummary.minScore,
        maxScore: reviewSummary.maxScore,
      },
    };
    const saved = existing
      ? await this.consensusReviewModel
          .findByIdAndUpdate(
            existing._id,
            { $set: update },
            { returnDocument: 'after' },
          )
          .lean<ConsensusReviewLean | null>()
          .exec()
      : await this.consensusReviewModel
          .create({
            ...update,
            draftSource: 'manual',
          })
          .then((created) => created.toObject<ConsensusReviewLean>());

    if (!saved) {
      throw new NotFoundException('Consensus review not found');
    }

    const projectUpdate: Record<string, unknown> = { finalLevel };

    if (!project.originalLevel) {
      projectUpdate.originalLevel = finalLevel;
    }

    await this.projectModel
      .updateOne({ _id: project._id }, { $set: projectUpdate })
      .exec();

    return this.toResponse(saved);
  }

  private async normalizeFinalLevel(finalLevel: string): Promise<string> {
    const levels = await this.dictionaryModel
      .find({ dictType: REVIEW_LEVEL_DICT_TYPE, isActive: true })
      .select({ code: 1, name: 1 })
      .lean<DictionaryLean[]>()
      .exec();

    if (levels.length === 0) {
      if (!['A', 'B', 'C', 'D'].includes(finalLevel)) {
        throw new BadRequestException('finalLevel must be A, B, C, or D');
      }

      return finalLevel;
    }

    const matched = levels.find(
      (level) => level.code === finalLevel || level.name === finalLevel,
    );

    if (!matched) {
      throw new BadRequestException('finalLevel is not a valid review_level');
    }

    return finalLevel;
  }

  private async assertReviewManagerAccess(
    projectId: string,
    currentUser: AuthenticatedUser,
  ): Promise<ProjectLean> {
    const project = await this.findActiveProject(projectId);

    if (
      !currentUser.user.roles.includes('review_manager') ||
      project.reviewManagerId?.toString() !== currentUser.user.id
    ) {
      throw new ForbiddenException();
    }

    return project;
  }

  private async findActiveProject(projectId: string): Promise<ProjectLean> {
    const project = await this.projectModel
      .findOne({ _id: toObjectId(projectId, 'projectId'), isActive: true })
      .lean<ProjectLean | null>()
      .exec();

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  private getProjectSnapshot(project: ProjectLean): ReviewSchemeSnapshot {
    if (!project.reviewSchemeSnapshot) {
      throw new ConflictException('Project review scheme snapshot is missing');
    }

    const value = project.reviewSchemeSnapshot;
    const totalScore = value.totalScore;
    const items = value.items;

    if (typeof totalScore !== 'number' || !Array.isArray(items)) {
      throw new ConflictException('Project review scheme snapshot is invalid');
    }

    return {
      id: typeof value.id === 'string' ? value.id : undefined,
      name: typeof value.name === 'string' ? value.name : undefined,
      totalScore,
      items: items.map((item) => {
        const record = item as Record<string, unknown>;

        return {
          name: String(record.name),
          maxScore: Number(record.maxScore),
          scoringGuide:
            typeof record.scoringGuide === 'string' ? record.scoringGuide : '',
          sortOrder:
            typeof record.sortOrder === 'number' ? record.sortOrder : 0,
          suggestionRequiredThresholdRatio:
            typeof record.suggestionRequiredThresholdRatio === 'number'
              ? record.suggestionRequiredThresholdRatio
              : 0.8,
        };
      }),
    };
  }

  private async findConsensus(
    projectId: Types.ObjectId,
  ): Promise<ConsensusReviewLean | null> {
    return this.consensusReviewModel
      .findOne({ projectId })
      .lean<ConsensusReviewLean | null>()
      .exec();
  }

  private async getConsensusByProject(
    projectId: Types.ObjectId,
  ): Promise<ConsensusReviewResponse> {
    const consensus = await this.findConsensus(projectId);

    if (!consensus) {
      throw new NotFoundException('Consensus review not found');
    }

    return this.toResponse(consensus);
  }

  private async toResponse(
    consensus: ConsensusReviewLean,
  ): Promise<ConsensusReviewResponse> {
    const confirmedByUser = await this.getConfirmedByUserSummary(
      consensus.confirmedByUserId,
    );

    return {
      id: consensus._id.toString(),
      projectId: consensus.projectId.toString(),
      reviewSchemeSnapshot: this.getSnapshotFromRecord(
        consensus.reviewSchemeSnapshot,
      ),
      draftGeneratedAt: consensus.draftGeneratedAt ?? null,
      draftGeneratedByUserId:
        consensus.draftGeneratedByUserId?.toString() ?? null,
      draftSource: consensus.draftSource,
      draftOpinion: consensus.draftOpinion,
      draftScore: consensus.draftScore ?? null,
      finalOpinion: consensus.finalOpinion,
      finalScore: consensus.finalScore ?? null,
      finalLevel: consensus.finalLevel,
      originalLevel: consensus.originalLevel,
      confirmedByUserId: consensus.confirmedByUserId?.toString() ?? null,
      confirmedByUser,
      confirmedAt: consensus.confirmedAt ?? null,
      status: consensus.status,
      expertReviewStats: consensus.expertReviewStats,
      createdAt: consensus.createdAt,
      updatedAt: consensus.updatedAt,
    };
  }

  private async getConfirmedByUserSummary(
    confirmedByUserId?: Types.ObjectId | string | null,
  ): Promise<ConsensusUserSummary | null> {
    if (!confirmedByUserId) {
      return null;
    }

    const userId = confirmedByUserId.toString();

    if (!Types.ObjectId.isValid(userId)) {
      return null;
    }

    const user = await this.userModel
      .findById(userId)
      .select({ name: 1, phone: 1 })
      .lean<UserSummaryLean | null>()
      .exec();

    if (!user) {
      return null;
    }

    return {
      id: user._id.toString(),
      name: user.name,
      phone: user.phone ?? null,
    };
  }

  private getSnapshotFromRecord(
    reviewSchemeSnapshot: Record<string, unknown>,
  ): ReviewSchemeSnapshot {
    return this.getProjectSnapshot({
      _id: new Types.ObjectId(),
      isActive: true,
      reviewSchemeSnapshot,
    });
  }
}
