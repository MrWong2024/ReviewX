import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { SessionAuthGuard } from '../../auth/guards/session-auth.guard';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import { QueryProjectOwnerProjectsDto } from '../dto/query-project-owner-projects.dto';
import { UpdateFollowUpNeedsDto } from '../dto/update-follow-up-needs.dto';
import { ProjectMaterialsService } from '../services/project-materials.service';

@Controller('project-owner/projects')
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles('project_owner')
export class ProjectOwnerProjectsController {
  constructor(
    private readonly projectMaterialsService: ProjectMaterialsService,
  ) {}

  @Get()
  list(
    @Query() query: QueryProjectOwnerProjectsDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.projectMaterialsService.listProjectOwnerProjects(
      query,
      currentUser,
    );
  }

  @Get(':id')
  findById(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.projectMaterialsService.getProjectOwnerProject(id, currentUser);
  }

  @Patch(':id/follow-up-needs')
  updateFollowUpNeeds(
    @Param('id') id: string,
    @Body() dto: UpdateFollowUpNeedsDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.projectMaterialsService.updateFollowUpNeeds(
      id,
      dto,
      currentUser,
    );
  }
}
