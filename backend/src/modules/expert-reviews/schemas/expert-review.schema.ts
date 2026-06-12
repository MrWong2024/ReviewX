import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';
import { EXPERT_REVIEW_STATUSES } from '../constants/expert-review.constants';
import type { ExpertReviewStatus } from '../constants/expert-review.constants';

export type ExpertReviewDocument = HydratedDocument<ExpertReview>;

export class ExpertReviewItemSnapshot {
  @Prop({ type: String, required: true, trim: true, minlength: 1 })
  name!: string;

  @Prop({ type: Number, required: true, min: 0 })
  maxScore!: number;

  @Prop({ type: String, default: '', trim: true })
  scoringGuide?: string;

  @Prop({ type: Number, default: 0, required: true })
  sortOrder!: number;

  @Prop({ type: Number, default: 0.8, min: 0, max: 1 })
  suggestionRequiredThresholdRatio!: number;
}

export class ExpertReviewItem {
  @Prop({
    type: {
      name: { type: String, required: true, trim: true },
      maxScore: { type: Number, required: true, min: 0 },
      scoringGuide: { type: String, default: '', trim: true },
      sortOrder: { type: Number, default: 0 },
      suggestionRequiredThresholdRatio: {
        type: Number,
        default: 0.8,
        min: 0,
        max: 1,
      },
    },
    required: true,
  })
  itemSnapshot!: ExpertReviewItemSnapshot;

  @Prop({ type: Number, default: null })
  score?: number | null;

  @Prop({ type: String, default: '', trim: true })
  evaluationDescription!: string;

  @Prop({ type: String, default: '', trim: true })
  improvementSuggestion!: string;

  @Prop({ type: Boolean, default: false, required: true })
  hasMajorIssue!: boolean;
}

@Schema({ collection: 'expert_reviews', timestamps: true })
export class ExpertReview {
  @Prop({ type: Types.ObjectId, ref: 'Project', required: true })
  projectId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  expertUserId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'ProjectExpertAssignment', default: null })
  assignmentId?: Types.ObjectId | null;

  @Prop({ type: SchemaTypes.Mixed, required: true })
  reviewSchemeSnapshot!: Record<string, unknown>;

  @Prop({
    type: [
      {
        itemSnapshot: {
          name: { type: String, required: true, trim: true },
          maxScore: { type: Number, required: true, min: 0 },
          scoringGuide: { type: String, default: '', trim: true },
          sortOrder: { type: Number, default: 0 },
          suggestionRequiredThresholdRatio: {
            type: Number,
            default: 0.8,
            min: 0,
            max: 1,
          },
        },
        score: { type: Number, default: null },
        evaluationDescription: { type: String, default: '', trim: true },
        improvementSuggestion: { type: String, default: '', trim: true },
        hasMajorIssue: { type: Boolean, default: false },
      },
    ],
    required: true,
    default: [],
  })
  items!: ExpertReviewItem[];

  @Prop({ type: Number, default: 0, required: true, min: 0 })
  totalScore!: number;

  @Prop({
    type: String,
    enum: EXPERT_REVIEW_STATUSES,
    default: 'draft',
    required: true,
  })
  status!: ExpertReviewStatus;

  @Prop({ type: Date, default: null })
  submittedAt?: Date | null;

  @Prop({ type: Date, default: null })
  returnedAt?: Date | null;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  returnedByUserId?: Types.ObjectId | null;

  @Prop({ type: String, default: '', trim: true })
  returnReason?: string;
}

export const ExpertReviewSchema = SchemaFactory.createForClass(ExpertReview);

ExpertReviewSchema.index({ projectId: 1, expertUserId: 1 }, { unique: true });
ExpertReviewSchema.index({ projectId: 1, status: 1 });
ExpertReviewSchema.index({ expertUserId: 1, status: 1 });
ExpertReviewSchema.index({ projectId: 1, submittedAt: -1 });
