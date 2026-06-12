import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { SessionAuthGuard } from '../../auth/guards/session-auth.guard';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import { ConfirmConsensusReviewDto } from '../dto/confirm-consensus-review.dto';
import { ConsensusReviewsService } from '../services/consensus-reviews.service';

@Controller('admin/projects/:id/consensus')
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles('admin')
export class AdminConsensusController {
  constructor(
    private readonly consensusReviewsService: ConsensusReviewsService,
  ) {}

  @Get()
  get(@Param('id') id: string) {
    return this.consensusReviewsService.getConsensusForAdmin(id);
  }

  @Post('confirm')
  confirm(
    @Param('id') id: string,
    @Body() dto: ConfirmConsensusReviewDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.consensusReviewsService.confirmForAdmin(id, dto, currentUser);
  }
}
