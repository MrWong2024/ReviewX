import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { SessionAuthGuard } from '../../auth/guards/session-auth.guard';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import { HandleProjectAppealDto } from '../dto/handle-project-appeal.dto';
import { ProjectAppealsService } from '../services/project-appeals.service';

@Controller('admin/projects/:id')
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles('admin')
export class AdminAppealsController {
  constructor(private readonly projectAppealsService: ProjectAppealsService) {}

  @Get('appeals')
  listAppeals(@Param('id') id: string) {
    return this.projectAppealsService.listAdminAppeals(id);
  }

  @Get('appeals/:appealId')
  getAppeal(@Param('id') id: string, @Param('appealId') appealId: string) {
    return this.projectAppealsService.getAdminAppeal(id, appealId);
  }

  @Get('appeals/:appealId/attachments')
  listAttachments(
    @Param('id') id: string,
    @Param('appealId') appealId: string,
  ) {
    return this.projectAppealsService.listAdminAppealAttachments(id, appealId);
  }

  @Get('appeals/:appealId/attachments/:attachmentId/download-url')
  getAttachmentDownloadUrl(
    @Param('id') id: string,
    @Param('appealId') appealId: string,
    @Param('attachmentId') attachmentId: string,
  ) {
    return this.projectAppealsService.getAdminAppealAttachmentDownloadUrl(
      id,
      appealId,
      attachmentId,
    );
  }

  @Post('appeals/:appealId/handle')
  handle(
    @Param('id') id: string,
    @Param('appealId') appealId: string,
    @Body() dto: HandleProjectAppealDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.projectAppealsService.handleAdminAppeal(
      id,
      appealId,
      dto,
      currentUser,
    );
  }

  @Get('level-history')
  getLevelHistory(@Param('id') id: string) {
    return this.projectAppealsService.listAdminLevelHistory(id);
  }
}
