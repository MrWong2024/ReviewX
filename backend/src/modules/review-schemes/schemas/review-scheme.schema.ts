import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ReviewSchemeDocument = HydratedDocument<ReviewScheme>;

export class ReviewSchemeItem {
  @Prop({ type: String, required: true, trim: true, minlength: 1 })
  name!: string;

  @Prop({ type: Number, required: true, min: 0 })
  maxScore!: number;

  @Prop({ type: String, default: '', trim: true })
  scoringGuide?: string;

  @Prop({ type: Number, default: 0, required: true })
  sortOrder!: number;

  @Prop({ type: Number, default: 0.8, min: 0, max: 1 })
  suggestionRequiredThresholdRatio!: number;
}

@Schema({ collection: 'review_schemes', timestamps: true })
export class ReviewScheme {
  @Prop({
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 1,
  })
  name!: string;

  @Prop({ type: String, default: '', trim: true })
  description?: string;

  @Prop({
    type: [
      {
        name: { type: String, required: true, trim: true },
        maxScore: { type: Number, required: true, min: 0 },
        scoringGuide: { type: String, default: '', trim: true },
        sortOrder: { type: Number, default: 0 },
        suggestionRequiredThresholdRatio: {
          type: Number,
          default: 0.8,
          min: 0,
          max: 1,
        },
      },
    ],
    required: true,
    default: [],
  })
  items!: ReviewSchemeItem[];

  @Prop({ type: Number, required: true, min: 0 })
  totalScore!: number;

  @Prop({ type: Boolean, default: true, required: true })
  isActive!: boolean;
}

export const ReviewSchemeSchema = SchemaFactory.createForClass(ReviewScheme);
ReviewSchemeSchema.index({ isActive: 1, name: 1 });
