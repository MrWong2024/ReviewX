import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { TreeDictionariesModule } from '../tree-dictionaries/tree-dictionaries.module';
import { OrganizationsController } from './controllers/organizations.controller';
import {
  Organization,
  OrganizationSchema,
} from './schemas/organization.schema';
import { OrganizationsService } from './services/organizations.service';

@Module({
  imports: [
    AuthModule,
    TreeDictionariesModule,
    MongooseModule.forFeature([
      { name: Organization.name, schema: OrganizationSchema },
    ]),
  ],
  controllers: [OrganizationsController],
  providers: [OrganizationsService],
  exports: [OrganizationsService],
})
export class OrganizationsModule {}
