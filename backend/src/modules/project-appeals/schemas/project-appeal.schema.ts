import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { PROJECT_APPEAL_STATUSES } from '../constants/project-appeal.constants';
import type { ProjectAppealStatus } from '../constants/project-appeal.constants';

export type ProjectAppealDocument = HydratedDocument<ProjectAppeal>;

@Schema({ collection: 'project_appeals', timestamps: true })
export class ProjectAppeal {
  @Prop({ type: Types.ObjectId, ref: 'Project', required: true })
  projectId!: Types.ObjectId;

  @Prop({ type: Number, required: true, min: 1, max: 3 })
  appealNo!: number;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  submittedByUserId!: Types.ObjectId;

  @Prop({ type: String, required: true, trim: true, minlength: 1 })
  reason!: string;

  @Prop({
    type: String,
    enum: PROJECT_APPEAL_STATUSES,
    default: 'submitted',
    required: true,
  })
  status!: ProjectAppealStatus;

  @Prop({ type: Types.ObjectId, ref: 'ConsensusReview', default: null })
  relatedConsensusReviewId?: Types.ObjectId | null;

  @Prop({ type: String, required: true, trim: true, minlength: 1 })
  levelBeforeAppeal!: string;

  @Prop({ type: String, default: '', trim: true })
  levelAfterHandling?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  handledByUserId?: Types.ObjectId | null;

  @Prop({ type: String, default: '', trim: true })
  handlingOpinion?: string;

  @Prop({ type: Date, default: null })
  handledAt?: Date | null;

  @Prop({ type: Boolean, default: false, required: true })
  causedLevelChange!: boolean;
}

export const ProjectAppealSchema = SchemaFactory.createForClass(ProjectAppeal);

ProjectAppealSchema.index({ projectId: 1, appealNo: 1 }, { unique: true });
ProjectAppealSchema.index({ projectId: 1, status: 1 });
ProjectAppealSchema.index({ submittedByUserId: 1, createdAt: -1 });
ProjectAppealSchema.index({ handledByUserId: 1, handledAt: -1 });
