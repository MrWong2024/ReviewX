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
import { Project, ProjectSchema } from '../projects/schemas/project.schema';
import { StorageModule } from '../storage/storage.module';
import { User, UserSchema } from '../users/schemas/user.schema';
import { AdminAppealsController } from './controllers/admin-appeals.controller';
import { ProjectOwnerAppealsController } from './controllers/project-owner-appeals.controller';
import { ReviewManagerAppealsController } from './controllers/review-manager-appeals.controller';
import {
  ProjectAppealAttachment,
  ProjectAppealAttachmentSchema,
} from './schemas/project-appeal-attachment.schema';
import {
  ProjectAppeal,
  ProjectAppealSchema,
} from './schemas/project-appeal.schema';
import {
  ProjectLevelChangeLog,
  ProjectLevelChangeLogSchema,
} from './schemas/project-level-change-log.schema';
import { ProjectAppealsService } from './services/project-appeals.service';

@Module({
  imports: [
    AuthModule,
    StorageModule,
    MongooseModule.forFeature([
      { name: ProjectAppeal.name, schema: ProjectAppealSchema },
      {
        name: ProjectAppealAttachment.name,
        schema: ProjectAppealAttachmentSchema,
      },
      { name: ProjectLevelChangeLog.name, schema: ProjectLevelChangeLogSchema },
      { name: Project.name, schema: ProjectSchema },
      { name: ConsensusReview.name, schema: ConsensusReviewSchema },
      { name: Dictionary.name, schema: DictionarySchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [
    ProjectOwnerAppealsController,
    ReviewManagerAppealsController,
    AdminAppealsController,
  ],
  providers: [ProjectAppealsService],
  exports: [ProjectAppealsService],
})
export class ProjectAppealsModule {}
