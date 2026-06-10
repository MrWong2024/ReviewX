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
import { CreateDictionaryDto } from '../dto/create-dictionary.dto';
import { QueryDictionariesDto } from '../dto/query-dictionaries.dto';
import { UpdateDictionaryDto } from '../dto/update-dictionary.dto';
import {
  DictionariesService,
  DictionaryResponse,
} from '../services/dictionaries.service';

@Controller('admin/dictionaries')
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles('admin')
export class DictionariesController {
  constructor(private readonly dictionariesService: DictionariesService) {}

  @Post()
  create(@Body() dto: CreateDictionaryDto): Promise<DictionaryResponse> {
    return this.dictionariesService.create(dto);
  }

  @Get()
  list(@Query() query: QueryDictionariesDto) {
    return this.dictionariesService.list(query);
  }

  @Get(':id')
  findById(@Param('id') id: string): Promise<DictionaryResponse> {
    return this.dictionariesService.findById(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateDictionaryDto,
  ): Promise<DictionaryResponse> {
    return this.dictionariesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<DictionaryResponse> {
    return this.dictionariesService.remove(id);
  }
}
