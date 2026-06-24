import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import {
  ConsensusReview,
  ConsensusReviewSchema,
} from '../consensus-reviews/schemas/consensus-review.schema';
import {
  ExpertReview,
  ExpertReviewSchema,
} from '../expert-reviews/schemas/expert-review.schema';
import { ProjectsModule } from '../projects/projects.module';
import { User, UserSchema } from '../users/schemas/user.schema';
import {
  ProjectExpertAssignment,
  ProjectExpertAssignmentSchema,
} from './schemas/project-expert-assignment.schema';
import {
  AdminProjectExpertAssignmentsController,
  ProjectExpertAssignmentsController,
} from './controllers/project-expert-assignments.controller';
import { ExpertEligibilityService } from './services/expert-eligibility.service';
import { ProjectExpertAssignmentsService } from './services/project-expert-assignments.service';

@Module({
  imports: [
    AuthModule,
    ProjectsModule,
    MongooseModule.forFeature([
      {
        name: ProjectExpertAssignment.name,
        schema: ProjectExpertAssignmentSchema,
      },
      { name: ConsensusReview.name, schema: ConsensusReviewSchema },
      { name: ExpertReview.name, schema: ExpertReviewSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [
    ProjectExpertAssignmentsController,
    AdminProjectExpertAssignmentsController,
  ],
  providers: [ProjectExpertAssignmentsService, ExpertEligibilityService],
  exports: [ProjectExpertAssignmentsService, ExpertEligibilityService],
})
export class ProjectExpertAssignmentsModule {}
