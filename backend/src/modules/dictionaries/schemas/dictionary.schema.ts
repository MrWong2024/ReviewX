import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type DictionaryDocument = HydratedDocument<Dictionary>;

@Schema({ collection: 'dictionaries', timestamps: true })
export class Dictionary {
  @Prop({ type: String, required: true, trim: true, minlength: 1 })
  dictType!: string;

  @Prop({ type: String, required: true, trim: true, minlength: 1 })
  code!: string;

  @Prop({ type: String, required: true, trim: true, minlength: 1 })
  name!: string;

  @Prop({ type: String, default: '', trim: true })
  description?: string;

  @Prop({ type: Number, default: 0, required: true })
  sortOrder!: number;

  @Prop({ type: Boolean, default: true, required: true })
  isActive!: boolean;
}

export const DictionarySchema = SchemaFactory.createForClass(Dictionary);
DictionarySchema.index({ dictType: 1, code: 1 }, { unique: true });
DictionarySchema.index({ dictType: 1, name: 1 }, { unique: true });
DictionarySchema.index({ dictType: 1, isActive: 1, sortOrder: 1 });
