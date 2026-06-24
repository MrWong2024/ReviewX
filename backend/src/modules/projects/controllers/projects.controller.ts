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
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { SessionAuthGuard } from '../../auth/guards/session-auth.guard';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import { BatchUpdateReviewAssignmentDto } from '../dto/batch-update-review-assignment.dto';
import { CreateProjectDto } from '../dto/create-project.dto';
import { QueryProjectsDto } from '../dto/query-projects.dto';
import { QueryReviewManagerProjectsDto } from '../dto/query-review-manager-projects.dto';
import { UpdateProjectDto } from '../dto/update-project.dto';
import { UpdateProjectScheduleDto } from '../dto/update-project-schedule.dto';
import { UpdateReviewAssignmentDto } from '../dto/update-review-assignment.dto';
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

  @Patch('review-assignment/batch')
  batchUpdateReviewAssignment(@Body() dto: BatchUpdateReviewAssignmentDto) {
    return this.projectsService.batchUpdateReviewAssignment(dto);
  }

  @Get(':id')
  findById(@Param('id') id: string): Promise<ProjectResponse> {
    return this.projectsService.findById(id);
  }

  @Patch(':id/review-assignment')
  updateReviewAssignment(
    @Param('id') id: string,
    @Body() dto: UpdateReviewAssignmentDto,
  ): Promise<ProjectResponse> {
    return this.projectsService.updateReviewAssignment(id, dto);
  }

  @Patch(':id/schedule')
  updateSchedule(
    @Param('id') id: string,
    @Body() dto: UpdateProjectScheduleDto,
  ): Promise<ProjectResponse> {
    return this.projectsService.updateScheduleForAdmin(id, dto);
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

@Controller('review-manager/projects')
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles('review_manager')
export class ReviewManagerProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  list(
    @Query() query: QueryReviewManagerProjectsDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.projectsService.listForReviewManager(query, currentUser);
  }

  @Patch(':id/schedule')
  updateSchedule(
    @Param('id') id: string,
    @Body() dto: UpdateProjectScheduleDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<ProjectResponse> {
    return this.projectsService.updateScheduleForReviewManager(
      id,
      dto,
      currentUser,
    );
  }
}
