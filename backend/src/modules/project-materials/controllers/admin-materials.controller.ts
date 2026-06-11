import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { SessionAuthGuard } from '../../auth/guards/session-auth.guard';
import { QueryProjectMaterialsDto } from '../dto/query-project-materials.dto';
import { ProjectMaterialsService } from '../services/project-materials.service';

@Controller('admin/projects/:id/materials')
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles('admin')
export class AdminMaterialsController {
  constructor(
    private readonly projectMaterialsService: ProjectMaterialsService,
  ) {}

  @Get()
  list(@Param('id') id: string, @Query() query: QueryProjectMaterialsDto) {
    return this.projectMaterialsService.listAdminMaterials(id, query);
  }

  @Get(':materialId/download-url')
  getDownloadUrl(
    @Param('id') id: string,
    @Param('materialId') materialId: string,
  ) {
    return this.projectMaterialsService.getAdminMaterialDownloadUrl(
      id,
      materialId,
    );
  }
}
