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
import {
  ProjectAppeal,
  ProjectAppealSchema,
} from '../project-appeals/schemas/project-appeal.schema';
import {
  ProjectExpertAssignment,
  ProjectExpertAssignmentSchema,
} from '../project-expert-assignments/schemas/project-expert-assignment.schema';
import {
  ProjectMaterial,
  ProjectMaterialSchema,
} from '../project-materials/schemas/project-material.schema';
import { Project, ProjectSchema } from '../projects/schemas/project.schema';
import { ClientDashboardController } from './controllers/client-dashboard.controller';
import { ClientDashboardService } from './services/client-dashboard.service';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: Project.name, schema: ProjectSchema },
      {
        name: ProjectExpertAssignment.name,
        schema: ProjectExpertAssignmentSchema,
      },
      { name: ExpertReview.name, schema: ExpertReviewSchema },
      { name: ConsensusReview.name, schema: ConsensusReviewSchema },
      { name: ProjectMaterial.name, schema: ProjectMaterialSchema },
      { name: ProjectAppeal.name, schema: ProjectAppealSchema },
    ]),
  ],
  controllers: [ClientDashboardController],
  providers: [ClientDashboardService],
})
export class ClientDashboardModule {}
