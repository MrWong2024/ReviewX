import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import {
  Dictionary,
  DictionarySchema,
} from '../dictionaries/schemas/dictionary.schema';
import { ExpertReviewsModule } from '../expert-reviews/expert-reviews.module';
import { Project, ProjectSchema } from '../projects/schemas/project.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { AdminConsensusController } from './controllers/admin-consensus.controller';
import { ReviewManagerConsensusController } from './controllers/review-manager-consensus.controller';
import {
  ConsensusReview,
  ConsensusReviewSchema,
} from './schemas/consensus-review.schema';
import { ConsensusReviewsService } from './services/consensus-reviews.service';

@Module({
  imports: [
    AuthModule,
    ExpertReviewsModule,
    MongooseModule.forFeature([
      { name: ConsensusReview.name, schema: ConsensusReviewSchema },
      { name: Project.name, schema: ProjectSchema },
      { name: Dictionary.name, schema: DictionarySchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [ReviewManagerConsensusController, AdminConsensusController],
  providers: [ConsensusReviewsService],
  exports: [ConsensusReviewsService],
})
export class ConsensusReviewsModule {}
