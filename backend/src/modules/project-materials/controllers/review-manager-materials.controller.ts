import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { SessionAuthGuard } from '../../auth/guards/session-auth.guard';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import { QueryProjectMaterialsDto } from '../dto/query-project-materials.dto';
import { ProjectMaterialsService } from '../services/project-materials.service';

@Controller('review-manager/projects/:id/materials')
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles('review_manager')
export class ReviewManagerMaterialsController {
  constructor(
    private readonly projectMaterialsService: ProjectMaterialsService,
  ) {}

  @Get()
  list(
    @Param('id') id: string,
    @Query() query: QueryProjectMaterialsDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.projectMaterialsService.listReviewManagerMaterials(
      id,
      query,
      currentUser,
    );
  }

  @Get(':materialId/download-url')
  getDownloadUrl(
    @Param('id') id: string,
    @Param('materialId') materialId: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.projectMaterialsService.getReviewManagerMaterialDownloadUrl(
      id,
      materialId,
      currentUser,
    );
  }
}
