import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { DictionariesController } from './controllers/dictionaries.controller';
import { Dictionary, DictionarySchema } from './schemas/dictionary.schema';
import { DictionariesService } from './services/dictionaries.service';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: Dictionary.name, schema: DictionarySchema },
    ]),
  ],
  controllers: [DictionariesController],
  providers: [DictionariesService],
  exports: [DictionariesService],
})
export class DictionariesModule {}
