import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { BatchesModule } from '../batches/batches.module';
import {
  Dictionary,
  DictionarySchema,
} from '../dictionaries/schemas/dictionary.schema';
import {
  Organization,
  OrganizationSchema,
} from '../organizations/schemas/organization.schema';
import { OrganizationsModule } from '../organizations/organizations.module';
import { Project, ProjectSchema } from '../projects/schemas/project.schema';
import { ProjectsModule } from '../projects/projects.module';
import {
  TreeDictionary,
  TreeDictionarySchema,
} from '../tree-dictionaries/schemas/tree-dictionary.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { UsersModule } from '../users/users.module';
import { ProjectImportsController } from './controllers/project-imports.controller';
import {
  ProjectImportJob,
  ProjectImportJobSchema,
} from './schemas/project-import-job.schema';
import {
  ProjectImportRow,
  ProjectImportRowSchema,
} from './schemas/project-import-row.schema';
import { ProjectImportsService } from './services/project-imports.service';

@Module({
  imports: [
    AuthModule,
    BatchesModule,
    OrganizationsModule,
    ProjectsModule,
    UsersModule,
    MongooseModule.forFeature([
      { name: ProjectImportJob.name, schema: ProjectImportJobSchema },
      { name: ProjectImportRow.name, schema: ProjectImportRowSchema },
      { name: Dictionary.name, schema: DictionarySchema },
      { name: TreeDictionary.name, schema: TreeDictionarySchema },
      { name: Organization.name, schema: OrganizationSchema },
      { name: User.name, schema: UserSchema },
      { name: Project.name, schema: ProjectSchema },
    ]),
  ],
  controllers: [ProjectImportsController],
  providers: [ProjectImportsService],
})
export class ProjectImportsModule {}
