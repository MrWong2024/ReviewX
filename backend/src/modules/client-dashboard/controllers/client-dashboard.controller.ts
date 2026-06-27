import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { SessionAuthGuard } from '../../auth/guards/session-auth.guard';
import { QueryClientDashboardOverviewDto } from '../dto/query-client-dashboard-overview.dto';
import { QueryClientDashboardProjectsDto } from '../dto/query-client-dashboard-projects.dto';
import { ClientDashboardService } from '../services/client-dashboard.service';

@Controller('client/dashboard')
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles('client')
export class ClientDashboardController {
  constructor(
    private readonly clientDashboardService: ClientDashboardService,
  ) {}

  @Get('overview')
  getOverview(@Query() query: QueryClientDashboardOverviewDto) {
    return this.clientDashboardService.getOverview(query);
  }

  @Get('projects')
  listProjects(@Query() query: QueryClientDashboardProjectsDto) {
    return this.clientDashboardService.listProjects(query);
  }
}
