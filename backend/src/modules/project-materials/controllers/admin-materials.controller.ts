import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { SessionAuthGuard } from '../../auth/guards/session-auth.guard';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import { DeleteProjectMaterialAdminDto } from '../dto/delete-project-material-admin.dto';
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

  @Delete(':materialId')
  remove(
    @Param('id') id: string,
    @Param('materialId') materialId: string,
    @Body() dto: DeleteProjectMaterialAdminDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.projectMaterialsService.deleteAdminMaterial(
      id,
      materialId,
      dto,
      currentUser,
    );
  }
}
