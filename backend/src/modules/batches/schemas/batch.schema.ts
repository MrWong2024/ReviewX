import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type BatchDocument = HydratedDocument<Batch>;

@Schema({ collection: 'batches', timestamps: true })
export class Batch {
  @Prop({
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 1,
  })
  name!: string;

  @Prop({ type: Number, default: null })
  year?: number | null;

  @Prop({ type: String, default: '', trim: true })
  description?: string;

  @Prop({ type: Boolean, default: true, required: true })
  isActive!: boolean;
}

export const BatchSchema = SchemaFactory.createForClass(Batch);
BatchSchema.index({ isActive: 1, name: 1 });
