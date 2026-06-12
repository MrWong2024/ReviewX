import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { SessionAuthGuard } from '../../auth/guards/session-auth.guard';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import { ConfirmConsensusReviewDto } from '../dto/confirm-consensus-review.dto';
import { GenerateConsensusDraftDto } from '../dto/generate-consensus-draft.dto';
import { ConsensusReviewsService } from '../services/consensus-reviews.service';

@Controller('review-manager/projects/:id/consensus')
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles('review_manager', 'admin')
export class ReviewManagerConsensusController {
  constructor(
    private readonly consensusReviewsService: ConsensusReviewsService,
  ) {}

  @Post('draft')
  generateDraft(
    @Param('id') id: string,
    @Query() query: GenerateConsensusDraftDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.consensusReviewsService.generateDraft(id, query, currentUser);
  }

  @Get()
  get(@Param('id') id: string, @CurrentUser() currentUser: AuthenticatedUser) {
    return this.consensusReviewsService.getConsensus(id, currentUser);
  }

  @Post('confirm')
  confirm(
    @Param('id') id: string,
    @Body() dto: ConfirmConsensusReviewDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.consensusReviewsService.confirm(id, dto, currentUser);
  }
}
