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
import { CreateProjectDto } from '../dto/create-project.dto';
import { QueryProjectsDto } from '../dto/query-projects.dto';
import { UpdateProjectDto } from '../dto/update-project.dto';
import { ProjectResponse, ProjectsService } from '../services/projects.service';

@Controller('admin/projects')
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles('admin')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  create(@Body() dto: CreateProjectDto): Promise<ProjectResponse> {
    return this.projectsService.create(dto);
  }

  @Get()
  list(@Query() query: QueryProjectsDto) {
    return this.projectsService.list(query);
  }

  @Get(':id')
  findById(@Param('id') id: string): Promise<ProjectResponse> {
    return this.projectsService.findById(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
  ): Promise<ProjectResponse> {
    return this.projectsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<ProjectResponse> {
    return this.projectsService.remove(id);
  }
}
