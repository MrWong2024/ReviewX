import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { SessionAuthGuard } from '../../auth/guards/session-auth.guard';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import { HandleProjectAppealDto } from '../dto/handle-project-appeal.dto';
import { ProjectAppealsService } from '../services/project-appeals.service';

@Controller('review-manager/projects/:id/appeals')
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles('review_manager')
export class ReviewManagerAppealsController {
  constructor(private readonly projectAppealsService: ProjectAppealsService) {}

  @Get()
  list(@Param('id') id: string, @CurrentUser() currentUser: AuthenticatedUser) {
    return this.projectAppealsService.listReviewManagerAppeals(id, currentUser);
  }

  @Get(':appealId')
  get(
    @Param('id') id: string,
    @Param('appealId') appealId: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.projectAppealsService.getReviewManagerAppeal(
      id,
      appealId,
      currentUser,
    );
  }

  @Get(':appealId/attachments')
  listAttachments(
    @Param('id') id: string,
    @Param('appealId') appealId: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.projectAppealsService.listReviewManagerAppealAttachments(
      id,
      appealId,
      currentUser,
    );
  }

  @Get(':appealId/attachments/:attachmentId/download-url')
  getAttachmentDownloadUrl(
    @Param('id') id: string,
    @Param('appealId') appealId: string,
    @Param('attachmentId') attachmentId: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.projectAppealsService.getReviewManagerAppealAttachmentDownloadUrl(
      id,
      appealId,
      attachmentId,
      currentUser,
    );
  }

  @Post(':appealId/handle')
  handle(
    @Param('id') id: string,
    @Param('appealId') appealId: string,
    @Body() dto: HandleProjectAppealDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.projectAppealsService.handleReviewManagerAppeal(
      id,
      appealId,
      dto,
      currentUser,
    );
  }
}
