import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { SessionAuthGuard } from '../../auth/guards/session-auth.guard';
import { CreateBatchDto } from '../dto/create-batch.dto';
import { QueryBatchesDto } from '../dto/query-batches.dto';
import { UpdateBatchDto } from '../dto/update-batch.dto';
import { BatchResponse, BatchesService } from '../services/batches.service';

@Controller('admin/batches')
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles('admin')
export class BatchesController {
  constructor(private readonly batchesService: BatchesService) {}

  @Post()
  create(@Body() dto: CreateBatchDto): Promise<BatchResponse> {
    return this.batchesService.create(dto);
  }

  @Get()
  list(@Query() query: QueryBatchesDto) {
    return this.batchesService.list(query);
  }

  @Get(':id')
  findById(@Param('id') id: string): Promise<BatchResponse> {
    return this.batchesService.findById(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateBatchDto,
  ): Promise<BatchResponse> {
    return this.batchesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<BatchResponse> {
    return this.batchesService.remove(id);
  }
}
