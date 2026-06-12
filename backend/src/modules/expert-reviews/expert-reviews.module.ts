import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import {
  ProjectExpertAssignment,
  ProjectExpertAssignmentSchema,
} from '../project-expert-assignments/schemas/project-expert-assignment.schema';
import {
  ProjectMaterial,
  ProjectMaterialSchema,
} from '../project-materials/schemas/project-material.schema';
import { Project, ProjectSchema } from '../projects/schemas/project.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { AdminExpertReviewsController } from './controllers/admin-expert-reviews.controller';
import { ExpertReviewTasksController } from './controllers/expert-review-tasks.controller';
import { ReviewManagerExpertReviewsController } from './controllers/review-manager-expert-reviews.controller';
import {
  ExpertReview,
  ExpertReviewSchema,
} from './schemas/expert-review.schema';
import { ExpertReviewsService } from './services/expert-reviews.service';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: ExpertReview.name, schema: ExpertReviewSchema },
      { name: Project.name, schema: ProjectSchema },
      {
        name: ProjectExpertAssignment.name,
        schema: ProjectExpertAssignmentSchema,
      },
      { name: ProjectMaterial.name, schema: ProjectMaterialSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [
    ExpertReviewTasksController,
    ReviewManagerExpertReviewsController,
    AdminExpertReviewsController,
  ],
  providers: [ExpertReviewsService],
  exports: [ExpertReviewsService],
})
export class ExpertReviewsModule {}
