import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';
import {
  CONSENSUS_DRAFT_SOURCES,
  CONSENSUS_REVIEW_STATUSES,
} from '../constants/consensus-review.constants';
import type {
  ConsensusDraftSource,
  ConsensusReviewStatus,
} from '../constants/consensus-review.constants';

export type ConsensusReviewDocument = HydratedDocument<ConsensusReview>;

export class ConsensusExpertReviewStats {
  @Prop({ type: Number, default: 0, required: true })
  expertCount!: number;

  @Prop({ type: Number, default: 0, required: true })
  submittedCount!: number;

  @Prop({ type: Number, default: null })
  averageScore?: number | null;

  @Prop({ type: Number, default: null })
  minScore?: number | null;

  @Prop({ type: Number, default: null })
  maxScore?: number | null;
}

@Schema({ collection: 'consensus_reviews', timestamps: true })
export class ConsensusReview {
  @Prop({ type: Types.ObjectId, ref: 'Project', required: true })
  projectId!: Types.ObjectId;

  @Prop({ type: SchemaTypes.Mixed, required: true })
  reviewSchemeSnapshot!: Record<string, unknown>;

  @Prop({ type: Date, default: null })
  draftGeneratedAt?: Date | null;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  draftGeneratedByUserId?: Types.ObjectId | null;

  @Prop({
    type: String,
    enum: CONSENSUS_DRAFT_SOURCES,
    default: 'manual',
    required: true,
  })
  draftSource!: ConsensusDraftSource;

  @Prop({ type: String, default: '', trim: true })
  draftOpinion?: string;

  @Prop({ type: Number, default: null })
  draftScore?: number | null;

  @Prop({ type: String, default: '', trim: true })
  finalOpinion?: string;

  @Prop({ type: Number, default: null })
  finalScore?: number | null;

  @Prop({ type: String, default: '', trim: true })
  finalLevel?: string;

  @Prop({ type: String, default: '', trim: true })
  originalLevel?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  confirmedByUserId?: Types.ObjectId | null;

  @Prop({ type: Date, default: null })
  confirmedAt?: Date | null;

  @Prop({
    type: String,
    enum: CONSENSUS_REVIEW_STATUSES,
    default: 'draft',
    required: true,
  })
  status!: ConsensusReviewStatus;

  @Prop({
    type: {
      expertCount: { type: Number, default: 0 },
      submittedCount: { type: Number, default: 0 },
      averageScore: { type: Number, default: null },
      minScore: { type: Number, default: null },
      maxScore: { type: Number, default: null },
    },
    default: {
      expertCount: 0,
      submittedCount: 0,
      averageScore: null,
      minScore: null,
      maxScore: null,
    },
    required: true,
  })
  expertReviewStats!: ConsensusExpertReviewStats;
}

export const ConsensusReviewSchema =
  SchemaFactory.createForClass(ConsensusReview);

ConsensusReviewSchema.index({ projectId: 1 }, { unique: true });
ConsensusReviewSchema.index({ status: 1 });
ConsensusReviewSchema.index({ confirmedAt: -1 });
