import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { SessionAuthGuard } from '../../auth/guards/session-auth.guard';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import { ReturnExpertReviewDto } from '../dto/return-expert-review.dto';
import { ExpertReviewsService } from '../services/expert-reviews.service';

@Controller('review-manager/projects/:id')
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles('review_manager', 'admin')
export class ReviewManagerExpertReviewsController {
  constructor(private readonly expertReviewsService: ExpertReviewsService) {}

  @Get('expert-reviews')
  list(@Param('id') id: string, @CurrentUser() currentUser: AuthenticatedUser) {
    return this.expertReviewsService.listProjectExpertReviews(id, currentUser);
  }

  @Get('expert-reviews/:expertUserId')
  get(
    @Param('id') id: string,
    @Param('expertUserId') expertUserId: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.expertReviewsService.getProjectExpertReview(
      id,
      expertUserId,
      currentUser,
    );
  }

  @Post('expert-reviews/:expertUserId/return')
  returnReview(
    @Param('id') id: string,
    @Param('expertUserId') expertUserId: string,
    @Body() dto: ReturnExpertReviewDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.expertReviewsService.returnExpertReview(
      id,
      expertUserId,
      dto,
      currentUser,
    );
  }

  @Get('review-summary')
  getSummary(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.expertReviewsService.getReviewSummary(id, currentUser);
  }
}
