import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { PROJECT_LEVEL_CHANGE_SOURCES } from '../constants/project-appeal.constants';
import type { ProjectLevelChangeSource } from '../constants/project-appeal.constants';

export type ProjectLevelChangeLogDocument =
  HydratedDocument<ProjectLevelChangeLog>;

@Schema({ collection: 'project_level_change_logs', timestamps: true })
export class ProjectLevelChangeLog {
  @Prop({ type: Types.ObjectId, ref: 'Project', required: true })
  projectId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'ProjectAppeal', default: null })
  appealId?: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'ConsensusReview', default: null })
  consensusReviewId?: Types.ObjectId | null;

  @Prop({ type: String, required: true, trim: true, minlength: 1 })
  fromLevel!: string;

  @Prop({ type: String, required: true, trim: true, minlength: 1 })
  toLevel!: string;

  @Prop({ type: String, default: '', trim: true })
  reason?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  changedByUserId!: Types.ObjectId;

  @Prop({ type: Date, default: Date.now, required: true })
  changedAt!: Date;

  @Prop({
    type: String,
    enum: PROJECT_LEVEL_CHANGE_SOURCES,
    required: true,
  })
  source!: ProjectLevelChangeSource;
}

export const ProjectLevelChangeLogSchema = SchemaFactory.createForClass(
  ProjectLevelChangeLog,
);

ProjectLevelChangeLogSchema.index({ projectId: 1, changedAt: -1 });
ProjectLevelChangeLogSchema.index({ appealId: 1 });
ProjectLevelChangeLogSchema.index({ changedByUserId: 1, changedAt: -1 });
ProjectLevelChangeLogSchema.index({ source: 1, changedAt: -1 });
