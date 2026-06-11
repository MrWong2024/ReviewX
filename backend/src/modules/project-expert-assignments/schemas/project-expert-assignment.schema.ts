import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export const PROJECT_EXPERT_ASSIGNMENT_SOURCES = ['manual', 'batch'] as const;
export type ProjectExpertAssignmentSource =
  (typeof PROJECT_EXPERT_ASSIGNMENT_SOURCES)[number];

export const PROJECT_EXPERT_ASSIGNMENT_STATUSES = [
  'assigned',
  'removed',
] as const;
export type ProjectExpertAssignmentStatus =
  (typeof PROJECT_EXPERT_ASSIGNMENT_STATUSES)[number];

export type ProjectExpertAssignmentDocument =
  HydratedDocument<ProjectExpertAssignment>;

@Schema({ collection: 'project_expert_assignments', timestamps: true })
export class ProjectExpertAssignment {
  @Prop({ type: Types.ObjectId, ref: 'Project', required: true })
  projectId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  expertUserId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  assignedByUserId!: Types.ObjectId;

  @Prop({
    type: String,
    enum: PROJECT_EXPERT_ASSIGNMENT_SOURCES,
    default: 'manual',
    required: true,
  })
  source!: ProjectExpertAssignmentSource;

  @Prop({
    type: String,
    enum: PROJECT_EXPERT_ASSIGNMENT_STATUSES,
    default: 'assigned',
    required: true,
  })
  status!: ProjectExpertAssignmentStatus;

  @Prop({ type: Date, default: null })
  removedAt?: Date | null;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  removedByUserId?: Types.ObjectId | null;
}

export const ProjectExpertAssignmentSchema = SchemaFactory.createForClass(
  ProjectExpertAssignment,
);

ProjectExpertAssignmentSchema.index(
  { projectId: 1, expertUserId: 1 },
  { unique: true },
);
ProjectExpertAssignmentSchema.index({ projectId: 1, status: 1 });
ProjectExpertAssignmentSchema.index({ expertUserId: 1, status: 1 });
ProjectExpertAssignmentSchema.index({ assignedByUserId: 1, createdAt: -1 });
