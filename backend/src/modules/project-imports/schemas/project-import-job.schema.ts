import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';
import { PROJECT_IMPORT_JOB_STATUSES } from '../constants/project-import-status';
import type { ProjectImportJobStatus } from '../constants/project-import-status';

export type ProjectImportJobDocument = HydratedDocument<ProjectImportJob>;

@Schema({ collection: 'project_import_jobs', timestamps: true })
export class ProjectImportJob {
  @Prop({ type: String, required: true, trim: true })
  originalFilename!: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  uploadedByUserId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Batch', required: true })
  batchId!: Types.ObjectId;

  @Prop({
    type: String,
    enum: PROJECT_IMPORT_JOB_STATUSES,
    required: true,
    default: 'pending_confirmation',
  })
  status!: ProjectImportJobStatus;

  @Prop({ type: Number, default: 0, required: true })
  totalRows!: number;

  @Prop({ type: Number, default: 0, required: true })
  importableRows!: number;

  @Prop({ type: Number, default: 0, required: true })
  pendingRows!: number;

  @Prop({ type: Number, default: 0, required: true })
  confirmedRows!: number;

  @Prop({ type: Number, default: 0, required: true })
  skippedRows!: number;

  @Prop({ type: Number, default: 0, required: true })
  failedRows!: number;

  @Prop({ type: SchemaTypes.Mixed, default: {} })
  fieldMapping!: Record<string, string>;

  @Prop({ type: String, default: '', trim: true })
  errorMessage?: string;
}

export const ProjectImportJobSchema =
  SchemaFactory.createForClass(ProjectImportJob);
ProjectImportJobSchema.index({ status: 1, createdAt: -1 });
ProjectImportJobSchema.index({ batchId: 1, createdAt: -1 });
ProjectImportJobSchema.index({ uploadedByUserId: 1, createdAt: -1 });
ProjectImportJobSchema.index({ createdAt: -1 });
