import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { SessionAuthGuard } from '../../auth/guards/session-auth.guard';
import { ExpertReviewsService } from '../services/expert-reviews.service';

@Controller('admin/projects/:id')
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles('admin')
export class AdminExpertReviewsController {
  constructor(private readonly expertReviewsService: ExpertReviewsService) {}

  @Get('expert-reviews')
  list(@Param('id') id: string) {
    return this.expertReviewsService.listProjectExpertReviewsForAdmin(id);
  }

  @Get('expert-reviews/:expertUserId')
  get(@Param('id') id: string, @Param('expertUserId') expertUserId: string) {
    return this.expertReviewsService.getProjectExpertReviewForAdmin(
      id,
      expertUserId,
    );
  }

  @Get('review-summary')
  getSummary(@Param('id') id: string) {
    return this.expertReviewsService.getReviewSummaryForAdmin(id);
  }
}
