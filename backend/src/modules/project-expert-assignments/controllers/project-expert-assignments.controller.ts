import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { SessionAuthGuard } from '../../auth/guards/session-auth.guard';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import { AppendProjectExpertsDto } from '../dto/append-project-experts.dto';
import { BatchProjectExpertsDto } from '../dto/batch-project-experts.dto';
import { QueryExpertCandidatesDto } from '../dto/query-expert-candidates.dto';
import { UpdateProjectExpertsDto } from '../dto/update-project-experts.dto';
import {
  AppendExpertsResult,
  BatchProjectExpertsResult,
  ExpertBasicResponse,
  ExpertCandidatePage,
  ProjectExpertAssignmentsService,
  RemoveExpertResult,
  ReplaceExpertsResult,
} from '../services/project-expert-assignments.service';

@Controller('review-manager/projects')
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles('review_manager', 'admin')
export class ProjectExpertAssignmentsController {
  constructor(
    private readonly assignmentsService: ProjectExpertAssignmentsService,
  ) {}

  @Put('experts/batch')
  batchUpdateExperts(
    @Body() dto: BatchProjectExpertsDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<BatchProjectExpertsResult> {
    return this.assignmentsService.batchUpdateExperts(dto, currentUser);
  }

  @Get(':id/expert-candidates')
  listCandidates(
    @Param('id') id: string,
    @Query() query: QueryExpertCandidatesDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<ExpertCandidatePage> {
    return this.assignmentsService.listCandidates(id, query, currentUser);
  }

  @Get(':id/experts')
  listAssignedExperts(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<ExpertBasicResponse[]> {
    return this.assignmentsService.listAssignedExperts(id, currentUser);
  }

  @Post(':id/experts')
  appendExperts(
    @Param('id') id: string,
    @Body() dto: AppendProjectExpertsDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<AppendExpertsResult> {
    return this.assignmentsService.appendExperts(id, dto, currentUser);
  }

  @Put(':id/experts')
  replaceExperts(
    @Param('id') id: string,
    @Body() dto: UpdateProjectExpertsDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<ReplaceExpertsResult> {
    return this.assignmentsService.replaceExperts(id, dto, currentUser);
  }

  @Delete(':id/experts/:expertUserId')
  removeExpert(
    @Param('id') id: string,
    @Param('expertUserId') expertUserId: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<RemoveExpertResult> {
    return this.assignmentsService.removeExpert(id, expertUserId, currentUser);
  }
}

@Controller('admin/projects')
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles('admin')
export class AdminProjectExpertCandidatesController {
  constructor(
    private readonly assignmentsService: ProjectExpertAssignmentsService,
  ) {}

  @Get(':id/expert-candidates')
  listCandidates(
    @Param('id') id: string,
    @Query() query: QueryExpertCandidatesDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<ExpertCandidatePage> {
    return this.assignmentsService.listCandidates(id, query, currentUser);
  }
}
