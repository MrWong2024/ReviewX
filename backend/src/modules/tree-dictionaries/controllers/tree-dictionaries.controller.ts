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
import { CreateTreeDictionaryDto } from '../dto/create-tree-dictionary.dto';
import { QueryTreeDictionariesDto } from '../dto/query-tree-dictionaries.dto';
import { UpdateTreeDictionaryDto } from '../dto/update-tree-dictionary.dto';
import {
  TreeDictionariesService,
  TreeDictionaryResponse,
} from '../services/tree-dictionaries.service';

@Controller('admin/tree-dictionaries')
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles('admin')
export class TreeDictionariesController {
  constructor(
    private readonly treeDictionariesService: TreeDictionariesService,
  ) {}

  @Post()
  create(
    @Body() dto: CreateTreeDictionaryDto,
  ): Promise<TreeDictionaryResponse> {
    return this.treeDictionariesService.create(dto);
  }

  @Get()
  list(@Query() query: QueryTreeDictionariesDto) {
    return this.treeDictionariesService.list(query);
  }

  @Get(':id')
  findById(@Param('id') id: string): Promise<TreeDictionaryResponse> {
    return this.treeDictionariesService.findById(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTreeDictionaryDto,
  ): Promise<TreeDictionaryResponse> {
    return this.treeDictionariesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<TreeDictionaryResponse> {
    return this.treeDictionariesService.remove(id);
  }
}
