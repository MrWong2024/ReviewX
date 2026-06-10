import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';
import { PROJECT_IMPORT_ROW_STATUSES } from '../constants/project-import-status';
import type { ProjectImportRowStatus } from '../constants/project-import-status';

export type ProjectImportRowDocument = HydratedDocument<ProjectImportRow>;

@Schema({ collection: 'project_import_rows', timestamps: true })
export class ProjectImportRow {
  @Prop({ type: Types.ObjectId, ref: 'ProjectImportJob', required: true })
  jobId!: Types.ObjectId;

  @Prop({ type: Number, required: true })
  rowNumber!: number;

  @Prop({ type: SchemaTypes.Mixed, default: {} })
  raw!: Record<string, unknown>;

  @Prop({ type: SchemaTypes.Mixed, default: {} })
  normalized!: Record<string, unknown>;

  @Prop({ type: SchemaTypes.Mixed, default: {} })
  resolved!: Record<string, unknown>;

  @Prop({ type: [SchemaTypes.Mixed], default: [] })
  issues!: Record<string, unknown>[];

  @Prop({
    type: String,
    enum: PROJECT_IMPORT_ROW_STATUSES,
    required: true,
  })
  status!: ProjectImportRowStatus;

  @Prop({ type: Types.ObjectId, ref: 'Project', default: null })
  projectId?: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  confirmedByUserId?: Types.ObjectId | null;

  @Prop({ type: Date, default: null })
  confirmedAt?: Date | null;
}

export const ProjectImportRowSchema =
  SchemaFactory.createForClass(ProjectImportRow);
ProjectImportRowSchema.index({ jobId: 1, rowNumber: 1 }, { unique: true });
ProjectImportRowSchema.index({ jobId: 1, status: 1 });
ProjectImportRowSchema.index({ jobId: 1, 'normalized.projectNo': 1 });
ProjectImportRowSchema.index({ projectId: 1 });
