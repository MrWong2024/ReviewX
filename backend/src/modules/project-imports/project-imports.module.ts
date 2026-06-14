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
import { ProjectImportFieldMappingsController } from './controllers/project-import-field-mappings.controller';
import { ProjectImportsController } from './controllers/project-imports.controller';
import {
  ProjectImportFieldMapping,
  ProjectImportFieldMappingSchema,
} from './schemas/project-import-field-mapping.schema';
import {
  ProjectImportJob,
  ProjectImportJobSchema,
} from './schemas/project-import-job.schema';
import {
  ProjectImportRow,
  ProjectImportRowSchema,
} from './schemas/project-import-row.schema';
import { ProjectImportFieldMappingsService } from './services/project-import-field-mappings.service';
import { ProjectImportsService } from './services/project-imports.service';

@Module({
  imports: [
    AuthModule,
    BatchesModule,
    OrganizationsModule,
    ProjectsModule,
    UsersModule,
    MongooseModule.forFeature([
      {
        name: ProjectImportFieldMapping.name,
        schema: ProjectImportFieldMappingSchema,
      },
      { name: ProjectImportJob.name, schema: ProjectImportJobSchema },
      { name: ProjectImportRow.name, schema: ProjectImportRowSchema },
      { name: Dictionary.name, schema: DictionarySchema },
      { name: TreeDictionary.name, schema: TreeDictionarySchema },
      { name: Organization.name, schema: OrganizationSchema },
      { name: User.name, schema: UserSchema },
      { name: Project.name, schema: ProjectSchema },
    ]),
  ],
  controllers: [ProjectImportFieldMappingsController, ProjectImportsController],
  providers: [ProjectImportFieldMappingsService, ProjectImportsService],
})
export class ProjectImportsModule {}
