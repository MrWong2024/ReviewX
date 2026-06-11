import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { STORAGE_DRIVERS } from '../../storage/storage.constants';
import type { StorageDriver } from '../../storage/storage.constants';
import { PROJECT_MATERIAL_STATUSES } from '../constants/project-material.constants';
import type { ProjectMaterialStatus } from '../constants/project-material.constants';

export type ProjectMaterialDocument = HydratedDocument<ProjectMaterial>;

@Schema({ collection: 'project_materials', timestamps: true })
export class ProjectMaterial {
  @Prop({ type: Types.ObjectId, ref: 'Project', required: true })
  projectId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Dictionary', required: true })
  materialTypeId!: Types.ObjectId;

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
    enum: PROJECT_MATERIAL_STATUSES,
    default: 'active',
    required: true,
  })
  status!: ProjectMaterialStatus;

  @Prop({ type: Date, default: null })
  deletedAt?: Date | null;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  deletedByUserId?: Types.ObjectId | null;
}

export const ProjectMaterialSchema =
  SchemaFactory.createForClass(ProjectMaterial);

ProjectMaterialSchema.index({ projectId: 1, status: 1 });
ProjectMaterialSchema.index({ projectId: 1, materialTypeId: 1, status: 1 });
ProjectMaterialSchema.index({ uploadedByUserId: 1, createdAt: -1 });
ProjectMaterialSchema.index({ objectKey: 1 }, { unique: true });
ProjectMaterialSchema.index({ createdAt: -1 });
