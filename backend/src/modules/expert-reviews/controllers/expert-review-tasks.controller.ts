import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { SessionAuthGuard } from '../../auth/guards/session-auth.guard';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import { QueryExpertReviewTasksDto } from '../dto/query-expert-review-tasks.dto';
import { SaveExpertReviewDto } from '../dto/save-expert-review.dto';
import { ExpertReviewsService } from '../services/expert-reviews.service';

@Controller('expert/review-tasks')
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles('expert')
export class ExpertReviewTasksController {
  constructor(private readonly expertReviewsService: ExpertReviewsService) {}

  @Get()
  list(
    @Query() query: QueryExpertReviewTasksDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.expertReviewsService.listExpertTasks(query, currentUser);
  }

  @Get(':projectId')
  get(
    @Param('projectId') projectId: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.expertReviewsService.getExpertTask(projectId, currentUser);
  }

  @Put(':projectId')
  saveDraft(
    @Param('projectId') projectId: string,
    @Body() dto: SaveExpertReviewDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.expertReviewsService.saveDraft(projectId, dto, currentUser);
  }

  @Post(':projectId/submit')
  submit(
    @Param('projectId') projectId: string,
    @Body() dto: SaveExpertReviewDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.expertReviewsService.submitReview(projectId, dto, currentUser);
  }
}
