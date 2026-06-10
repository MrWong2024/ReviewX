import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type TreeDictionaryDocument = HydratedDocument<TreeDictionary>;

@Schema({ collection: 'tree_dictionaries', timestamps: true })
export class TreeDictionary {
  @Prop({ type: String, required: true, trim: true, minlength: 1 })
  treeType!: string;

  @Prop({ type: Types.ObjectId, ref: 'TreeDictionary', default: null })
  parentId?: Types.ObjectId | null;

  @Prop({ type: String, default: '', trim: true })
  code?: string;

  @Prop({ type: String, required: true, trim: true, minlength: 1 })
  name!: string;

  @Prop({ type: String, default: '', trim: true })
  fullName?: string;

  @Prop({
    type: [{ type: Types.ObjectId, ref: 'TreeDictionary' }],
    default: [],
  })
  pathIds!: Types.ObjectId[];

  @Prop({ type: Number, required: true, min: 1 })
  level!: number;

  @Prop({ type: Number, default: 0, required: true })
  sortOrder!: number;

  @Prop({ type: Boolean, default: true, required: true })
  isActive!: boolean;
}

export const TreeDictionarySchema =
  SchemaFactory.createForClass(TreeDictionary);
TreeDictionarySchema.index(
  { treeType: 1, parentId: 1, name: 1 },
  { unique: true },
);
TreeDictionarySchema.index({ treeType: 1, code: 1 });
TreeDictionarySchema.index({ treeType: 1, parentId: 1, sortOrder: 1 });
TreeDictionarySchema.index({ pathIds: 1 });
