import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { BatchesModule } from '../batches/batches.module';
import { DictionariesModule } from '../dictionaries/dictionaries.module';
import { OrganizationsModule } from '../organizations/organizations.module';
import { ReviewSchemesModule } from '../review-schemes/review-schemes.module';
import { TreeDictionariesModule } from '../tree-dictionaries/tree-dictionaries.module';
import { UsersModule } from '../users/users.module';
import { ProjectsController } from './controllers/projects.controller';
import { Project, ProjectSchema } from './schemas/project.schema';
import { ProjectsService } from './services/projects.service';

@Module({
  imports: [
    AuthModule,
    BatchesModule,
    DictionariesModule,
    TreeDictionariesModule,
    OrganizationsModule,
    ReviewSchemesModule,
    UsersModule,
    MongooseModule.forFeature([{ name: Project.name, schema: ProjectSchema }]),
  ],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
