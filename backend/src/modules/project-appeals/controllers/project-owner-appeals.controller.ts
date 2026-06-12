import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
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
} from '../../project-materials/constants/project-material.constants';
import { CreateProjectAppealDto } from '../dto/create-project-appeal.dto';
import { UploadProjectAppealAttachmentsDto } from '../dto/upload-project-appeal-attachments.dto';
import {
  ProjectAppealsService,
  UploadedProjectAppealFile,
} from '../services/project-appeals.service';

@Controller('project-owner/projects/:id')
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles('project_owner')
export class ProjectOwnerAppealsController {
  constructor(private readonly projectAppealsService: ProjectAppealsService) {}

  @Get('consensus')
  getConsensus(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.projectAppealsService.getOwnerConfirmedConsensus(
      id,
      currentUser,
    );
  }

  @Get('level-history')
  getLevelHistory(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.projectAppealsService.listOwnerLevelHistory(id, currentUser);
  }

  @Get('appeals')
  listAppeals(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.projectAppealsService.listOwnerAppeals(id, currentUser);
  }

  @Get('appeals/:appealId')
  getAppeal(
    @Param('id') id: string,
    @Param('appealId') appealId: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.projectAppealsService.getOwnerAppeal(id, appealId, currentUser);
  }

  @Post('appeals')
  @UseInterceptors(
    FilesInterceptor('files', PROJECT_MATERIAL_MAX_FILES, {
      limits: {
        files: PROJECT_MATERIAL_MAX_FILES,
        fileSize: PROJECT_MATERIAL_MAX_FILE_SIZE_BYTES,
      },
    }),
  )
  createAppeal(
    @Param('id') id: string,
    @Body() dto: CreateProjectAppealDto,
    @UploadedFiles() files: UploadedProjectAppealFile[] | undefined,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.projectAppealsService.createOwnerAppeal({
      projectId: id,
      dto,
      files,
      currentUser,
    });
  }

  @Post('appeals/:appealId/attachments')
  @UseInterceptors(
    FilesInterceptor('files', PROJECT_MATERIAL_MAX_FILES, {
      limits: {
        files: PROJECT_MATERIAL_MAX_FILES,
        fileSize: PROJECT_MATERIAL_MAX_FILE_SIZE_BYTES,
      },
    }),
  )
  uploadAttachments(
    @Param('id') id: string,
    @Param('appealId') appealId: string,
    @Body() dto: UploadProjectAppealAttachmentsDto,
    @UploadedFiles() files: UploadedProjectAppealFile[] | undefined,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.projectAppealsService.uploadOwnerAppealAttachments({
      projectId: id,
      appealId,
      dto,
      files,
      currentUser,
    });
  }

  @Get('appeals/:appealId/attachments')
  listAttachments(
    @Param('id') id: string,
    @Param('appealId') appealId: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.projectAppealsService.listOwnerAppealAttachments(
      id,
      appealId,
      currentUser,
    );
  }

  @Get('appeals/:appealId/attachments/:attachmentId/download-url')
  getAttachmentDownloadUrl(
    @Param('id') id: string,
    @Param('appealId') appealId: string,
    @Param('attachmentId') attachmentId: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.projectAppealsService.getOwnerAppealAttachmentDownloadUrl(
      id,
      appealId,
      attachmentId,
      currentUser,
    );
  }

  @Delete('appeals/:appealId/attachments/:attachmentId')
  deleteAttachment(
    @Param('id') id: string,
    @Param('appealId') appealId: string,
    @Param('attachmentId') attachmentId: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.projectAppealsService.softDeleteOwnerAppealAttachment(
      id,
      appealId,
      attachmentId,
      currentUser,
    );
  }
}
