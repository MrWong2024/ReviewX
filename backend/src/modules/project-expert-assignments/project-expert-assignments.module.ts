import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
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
  AdminProjectExpertCandidatesController,
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
      { name: ExpertReview.name, schema: ExpertReviewSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [
    ProjectExpertAssignmentsController,
    AdminProjectExpertCandidatesController,
  ],
  providers: [ProjectExpertAssignmentsService, ExpertEligibilityService],
  exports: [ProjectExpertAssignmentsService, ExpertEligibilityService],
})
export class ProjectExpertAssignmentsModule {}
