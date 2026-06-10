import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';

export type ProjectDocument = HydratedDocument<Project>;

@Schema({ collection: 'projects', timestamps: true })
export class Project {
  @Prop({ type: Types.ObjectId, ref: 'Batch', required: true })
  batchId!: Types.ObjectId;

  @Prop({ type: String, required: true, trim: true, minlength: 1 })
  projectNo!: string;

  @Prop({ type: String, required: true, trim: true, minlength: 1 })
  name!: string;

  @Prop({ type: Types.ObjectId, ref: 'TreeDictionary', default: null })
  projectTypeId?: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'Dictionary', default: null })
  statusId?: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  ownerUserId?: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'Organization', default: null })
  leadOrganizationId?: Types.ObjectId | null;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Organization' }], default: [] })
  cooperationOrganizationIds!: Types.ObjectId[];

  @Prop({ type: Number, default: null })
  totalFunding?: number | null;

  @Prop({ type: Number, default: null })
  allocatedFunding?: number | null;

  @Prop({
    type: [{ type: Types.ObjectId, ref: 'TreeDictionary' }],
    default: [],
  })
  disciplineIds!: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: 'TreeDictionary', default: null })
  departmentId?: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  reviewManagerId?: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, ref: 'ReviewScheme', default: null })
  reviewSchemeId?: Types.ObjectId | null;

  @Prop({ type: Date, default: null })
  reviewTime?: Date | null;

  @Prop({ type: String, default: '', trim: true })
  reviewLocation?: string;

  @Prop({ type: String, default: '', trim: true })
  meetingUrl?: string;

  @Prop({ type: String, default: '', trim: true })
  followUpNeeds?: string;

  @Prop({ type: String, default: '', trim: true })
  finalLevel?: string;

  @Prop({ type: String, default: '', trim: true })
  originalLevel?: string;

  @Prop({ type: String, default: '', trim: true })
  importedFromJobId?: string;

  @Prop({ type: SchemaTypes.Mixed, default: null })
  reviewSchemeSnapshot?: Record<string, unknown> | null;

  @Prop({ type: Boolean, default: true, required: true })
  isActive!: boolean;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);
ProjectSchema.index({ batchId: 1, projectNo: 1 }, { unique: true });
ProjectSchema.index({ batchId: 1, isActive: 1, createdAt: -1 });
ProjectSchema.index({ name: 1 });
ProjectSchema.index({ ownerUserId: 1 });
ProjectSchema.index({ reviewManagerId: 1 });
ProjectSchema.index({ reviewSchemeId: 1 });
