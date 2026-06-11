import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { SessionAuthGuard } from '../../auth/guards/session-auth.guard';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import { QueryExpertProjectsDto } from '../dto/query-expert-projects.dto';
import { QueryProjectMaterialsDto } from '../dto/query-project-materials.dto';
import { ProjectMaterialsService } from '../services/project-materials.service';

@Controller('expert/projects')
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles('expert')
export class ExpertMaterialsController {
  constructor(
    private readonly projectMaterialsService: ProjectMaterialsService,
  ) {}

  @Get()
  listProjects(
    @Query() query: QueryExpertProjectsDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.projectMaterialsService.listExpertProjects(query, currentUser);
  }

  @Get(':id')
  findProjectById(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.projectMaterialsService.getExpertProject(id, currentUser);
  }

  @Get(':id/materials')
  listMaterials(
    @Param('id') id: string,
    @Query() query: QueryProjectMaterialsDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.projectMaterialsService.listExpertMaterials(
      id,
      query,
      currentUser,
    );
  }

  @Get(':id/materials/:materialId/download-url')
  getDownloadUrl(
    @Param('id') id: string,
    @Param('materialId') materialId: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.projectMaterialsService.getExpertMaterialDownloadUrl(
      id,
      materialId,
      currentUser,
    );
  }
}
