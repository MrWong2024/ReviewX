import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { STORAGE_DRIVERS } from '../../storage/storage.constants';
import type { StorageDriver } from '../../storage/storage.constants';
import { PROJECT_MATERIAL_SCHEMA_STATUSES } from '../constants/project-material.constants';
import type { ProjectMaterialPersistedStatus } from '../constants/project-material.constants';

export const PROJECT_MATERIAL_DELETED_BY_ROLES = [
  'project_owner',
  'admin',
] as const;
export type ProjectMaterialDeletedByRole =
  (typeof PROJECT_MATERIAL_DELETED_BY_ROLES)[number];

export type ProjectMaterialDeletionLogDocument =
  HydratedDocument<ProjectMaterialDeletionLog>;

@Schema({ collection: 'project_material_deletion_logs', timestamps: true })
export class ProjectMaterialDeletionLog {
  @Prop({ type: Types.ObjectId, ref: 'Project', required: true })
  projectId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'ProjectMaterial', required: true })
  materialId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Dictionary', required: true })
  materialTypeId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  uploadedByUserId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  deletedByUserId!: Types.ObjectId;

  @Prop({
    type: String,
    enum: PROJECT_MATERIAL_DELETED_BY_ROLES,
    required: true,
  })
  deletedByRole!: ProjectMaterialDeletedByRole;

  @Prop({ type: String, default: '', trim: true })
  deleteReason?: string;

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
    enum: PROJECT_MATERIAL_SCHEMA_STATUSES,
    required: true,
  })
  materialStatusBeforeDelete!: ProjectMaterialPersistedStatus;

  @Prop({ type: Date, default: null })
  submittedAt?: Date | null;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  submittedByUserId?: Types.ObjectId | null;

  @Prop({ type: Boolean, required: true })
  storageDeleteSucceeded!: boolean;

  @Prop({ type: String, default: null })
  storageDeleteError?: string | null;

  @Prop({ type: Date, required: true })
  deletedAt!: Date;
}

export const ProjectMaterialDeletionLogSchema = SchemaFactory.createForClass(
  ProjectMaterialDeletionLog,
);

ProjectMaterialDeletionLogSchema.index({ projectId: 1, deletedAt: -1 });
ProjectMaterialDeletionLogSchema.index({ materialId: 1 });
ProjectMaterialDeletionLogSchema.index({ deletedByUserId: 1, deletedAt: -1 });
ProjectMaterialDeletionLogSchema.index({ deletedByRole: 1, deletedAt: -1 });
