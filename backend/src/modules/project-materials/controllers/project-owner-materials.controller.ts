import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { SessionAuthGuard } from '../../auth/guards/session-auth.guard';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import {
  PROJECT_MATERIAL_MAX_FILES,
  PROJECT_MATERIAL_MAX_FILE_SIZE_BYTES,
} from '../constants/project-material.constants';
import { QueryProjectMaterialsDto } from '../dto/query-project-materials.dto';
import { UploadProjectMaterialsDto } from '../dto/upload-project-materials.dto';
import {
  ProjectMaterialsService,
  UploadedProjectMaterialFile,
} from '../services/project-materials.service';

@Controller('project-owner/projects/:id/materials')
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles('project_owner')
export class ProjectOwnerMaterialsController {
  constructor(
    private readonly projectMaterialsService: ProjectMaterialsService,
  ) {}

  @Get()
  list(
    @Param('id') id: string,
    @Query() query: QueryProjectMaterialsDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.projectMaterialsService.listOwnerMaterials(
      id,
      query,
      currentUser,
    );
  }

  @Post()
  @UseInterceptors(
    FilesInterceptor('files', PROJECT_MATERIAL_MAX_FILES, {
      limits: {
        files: PROJECT_MATERIAL_MAX_FILES,
        fileSize: PROJECT_MATERIAL_MAX_FILE_SIZE_BYTES,
      },
    }),
  )
  upload(
    @Param('id') id: string,
    @Body() dto: UploadProjectMaterialsDto,
    @UploadedFiles() files: UploadedProjectMaterialFile[] | undefined,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.projectMaterialsService.uploadOwnerMaterials({
      projectId: id,
      dto,
      files,
      currentUser,
    });
  }

  @Get(':materialId/download-url')
  getDownloadUrl(
    @Param('id') id: string,
    @Param('materialId') materialId: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.projectMaterialsService.getOwnerMaterialDownloadUrl(
      id,
      materialId,
      currentUser,
    );
  }

  @Delete(':materialId')
  remove(
    @Param('id') id: string,
    @Param('materialId') materialId: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.projectMaterialsService.softDeleteOwnerMaterial(
      id,
      materialId,
      currentUser,
    );
  }
}
