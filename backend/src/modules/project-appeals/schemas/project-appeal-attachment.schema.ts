import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { STORAGE_DRIVERS } from '../../storage/storage.constants';
import type { StorageDriver } from '../../storage/storage.constants';
import { PROJECT_APPEAL_ATTACHMENT_STATUSES } from '../constants/project-appeal.constants';
import type { ProjectAppealAttachmentStatus } from '../constants/project-appeal.constants';

export type ProjectAppealAttachmentDocument =
  HydratedDocument<ProjectAppealAttachment>;

@Schema({ collection: 'project_appeal_attachments', timestamps: true })
export class ProjectAppealAttachment {
  @Prop({ type: Types.ObjectId, ref: 'ProjectAppeal', required: true })
  appealId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Project', required: true })
  projectId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  uploadedByUserId!: Types.ObjectId;

  @Prop({ type: String, required: true, trim: true, minlength: 1 })
  originalFilename!: string;

  @Prop({ type: String, required: true, trim: true, minlength: 1 })
  safeFilename!: string;

  @Prop({ type: String, required: true, trim: true, minlength: 1 })
  objectKey!: string;

  @Prop({ type: String, required: true, trim: true, minlength: 1 })
  bucket!: string;

  @Prop({
    type: String,
    enum: STORAGE_DRIVERS,
    required: true,
  })
  storageDriver!: StorageDriver;

  @Prop({ type: String, required: true, trim: true, minlength: 1 })
  mimeType!: string;

  @Prop({ type: String, required: true, trim: true, lowercase: true })
  extension!: string;

  @Prop({ type: Number, required: true, min: 0 })
  sizeBytes!: number;

  @Prop({ type: String, default: '', trim: true })
  sha256?: string;

  @Prop({ type: String, default: '', trim: true })
  remark?: string;

  @Prop({
    type: String,
    enum: PROJECT_APPEAL_ATTACHMENT_STATUSES,
    default: 'active',
    required: true,
  })
  status!: ProjectAppealAttachmentStatus;

  @Prop({ type: Date, default: null })
  deletedAt?: Date | null;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  deletedByUserId?: Types.ObjectId | null;
}

export const ProjectAppealAttachmentSchema = SchemaFactory.createForClass(
  ProjectAppealAttachment,
);

ProjectAppealAttachmentSchema.index({ appealId: 1, status: 1 });
ProjectAppealAttachmentSchema.index({ projectId: 1, status: 1 });
ProjectAppealAttachmentSchema.index({ uploadedByUserId: 1, createdAt: -1 });
ProjectAppealAttachmentSchema.index({ objectKey: 1 }, { unique: true });
ProjectAppealAttachmentSchema.index({ createdAt: -1 });
