import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type OrganizationDocument = HydratedDocument<Organization>;

@Schema({ collection: 'organizations', timestamps: true })
export class Organization {
  @Prop({
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 1,
  })
  name!: string;

  @Prop({ type: String, default: '', trim: true })
  contactName?: string;

  @Prop({ type: String, default: '', trim: true })
  contactPhone?: string;

  @Prop({ type: Types.ObjectId, ref: 'TreeDictionary', default: null })
  regionId?: Types.ObjectId | null;

  @Prop({ type: Boolean, default: true, required: true })
  isActive!: boolean;
}

export const OrganizationSchema = SchemaFactory.createForClass(Organization);
OrganizationSchema.index({ isActive: 1, name: 1 });
OrganizationSchema.index({ regionId: 1 });
