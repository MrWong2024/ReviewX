import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { ReviewSchemesController } from './controllers/review-schemes.controller';
import {
  ReviewScheme,
  ReviewSchemeSchema,
} from './schemas/review-scheme.schema';
import { ReviewSchemesService } from './services/review-schemes.service';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: ReviewScheme.name, schema: ReviewSchemeSchema },
    ]),
  ],
  controllers: [ReviewSchemesController],
  providers: [ReviewSchemesService],
  exports: [ReviewSchemesService],
})
export class ReviewSchemesModule {}
