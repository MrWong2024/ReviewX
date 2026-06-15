import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { Batch, BatchSchema } from '../batches/schemas/batch.schema';
import {
  Dictionary,
  DictionarySchema,
} from '../dictionaries/schemas/dictionary.schema';
import {
  Organization,
  OrganizationSchema,
} from '../organizations/schemas/organization.schema';
import {
  ReviewScheme,
  ReviewSchemeSchema,
} from '../review-schemes/schemas/review-scheme.schema';
import {
  TreeDictionary,
  TreeDictionarySchema,
} from '../tree-dictionaries/schemas/tree-dictionary.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { PortalReferenceDataController } from './controllers/portal-reference-data.controller';
import { PortalReferenceDataService } from './services/portal-reference-data.service';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: Dictionary.name, schema: DictionarySchema },
      { name: TreeDictionary.name, schema: TreeDictionarySchema },
      { name: Batch.name, schema: BatchSchema },
      { name: Organization.name, schema: OrganizationSchema },
      { name: ReviewScheme.name, schema: ReviewSchemeSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [PortalReferenceDataController],
  providers: [PortalReferenceDataService],
})
export class PortalReferenceDataModule {}
