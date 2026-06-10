import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { TreeDictionariesController } from './controllers/tree-dictionaries.controller';
import {
  TreeDictionary,
  TreeDictionarySchema,
} from './schemas/tree-dictionary.schema';
import { TreeDictionariesService } from './services/tree-dictionaries.service';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: TreeDictionary.name, schema: TreeDictionarySchema },
    ]),
  ],
  controllers: [TreeDictionariesController],
  providers: [TreeDictionariesService],
  exports: [TreeDictionariesService],
})
export class TreeDictionariesModule {}
