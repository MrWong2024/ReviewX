import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { PROJECT_IMPORT_STANDARD_FIELDS } from '../constants/project-import-field-map';
import type { ProjectImportStandardField } from '../constants/project-import-field-map';

export type ProjectImportFieldMappingDocument =
  HydratedDocument<ProjectImportFieldMapping>;

@Schema({ collection: 'project_import_field_mappings', timestamps: true })
export class ProjectImportFieldMapping {
  @Prop({
    type: String,
    enum: PROJECT_IMPORT_STANDARD_FIELDS,
    required: true,
  })
  standardField!: ProjectImportStandardField;

  @Prop({ type: [String], required: true, default: [] })
  aliases!: string[];

  @Prop({ type: [String], required: true, default: [] })
  normalizedAliases!: string[];

  @Prop({ type: Boolean, required: true, default: true })
  isActive!: boolean;

  @Prop({ type: String, default: '', trim: true })
  description?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  createdByUserId?: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  updatedByUserId?: Types.ObjectId | null;
}

export const ProjectImportFieldMappingSchema = SchemaFactory.createForClass(
  ProjectImportFieldMapping,
);
ProjectImportFieldMappingSchema.index({ standardField: 1 }, { unique: true });
ProjectImportFieldMappingSchema.index({ isActive: 1 });
ProjectImportFieldMappingSchema.index({ normalizedAliases: 1 });
