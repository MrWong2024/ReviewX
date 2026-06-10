import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';
import { Batch, BatchSchema } from './schemas/batch.schema';
import { BatchesController } from './controllers/batches.controller';
import { BatchesService } from './services/batches.service';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([{ name: Batch.name, schema: BatchSchema }]),
  ],
  controllers: [BatchesController],
  providers: [BatchesService],
  exports: [BatchesService],
})
export class BatchesModule {}
