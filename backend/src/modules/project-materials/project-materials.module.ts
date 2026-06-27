import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import {
  ConsensusReview,
  ConsensusReviewSchema,
} from '../consensus-reviews/schemas/consensus-review.schema';
import {
  Dictionary,
  DictionarySchema,
} from '../dictionaries/schemas/dictionary.schema';
import {
  ProjectExpertAssignment,
  ProjectExpertAssignmentSchema,
} from '../project-expert-assignments/schemas/project-expert-assignment.schema';
import { Project, ProjectSchema } from '../projects/schemas/project.schema';
import { StorageModule } from '../storage/storage.module';
import { User, UserSchema } from '../users/schemas/user.schema';
import { AdminMaterialsController } from './controllers/admin-materials.controller';
import { ExpertMaterialsController } from './controllers/expert-materials.controller';
import { ProjectOwnerMaterialsController } from './controllers/project-owner-materials.controller';
import { ProjectOwnerProjectsController } from './controllers/project-owner-projects.controller';
import { ReviewManagerMaterialsController } from './controllers/review-manager-materials.controller';
import {
  ProjectMaterialDeletionLog,
  ProjectMaterialDeletionLogSchema,
} from './schemas/project-material-deletion-log.schema';
import {
  ProjectMaterial,
  ProjectMaterialSchema,
} from './schemas/project-material.schema';
import { ProjectMaterialsService } from './services/project-materials.service';

@Module({
  imports: [
    AuthModule,
    StorageModule,
    MongooseModule.forFeature([
      { name: ProjectMaterial.name, schema: ProjectMaterialSchema },
      {
        name: ProjectMaterialDeletionLog.name,
        schema: ProjectMaterialDeletionLogSchema,
      },
      { name: Project.name, schema: ProjectSchema },
      { name: ConsensusReview.name, schema: ConsensusReviewSchema },
      { name: Dictionary.name, schema: DictionarySchema },
      {
        name: ProjectExpertAssignment.name,
        schema: ProjectExpertAssignmentSchema,
      },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [
    ProjectOwnerProjectsController,
    ProjectOwnerMaterialsController,
    ReviewManagerMaterialsController,
    ExpertMaterialsController,
    AdminMaterialsController,
  ],
  providers: [ProjectMaterialsService],
  exports: [ProjectMaterialsService],
})
export class ProjectMaterialsModule {}
