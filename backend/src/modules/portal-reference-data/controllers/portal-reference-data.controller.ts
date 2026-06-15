import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { SessionAuthGuard } from '../../auth/guards/session-auth.guard';
import {
  PortalBatchSummary,
  PortalDictionarySummary,
  PortalListResponse,
  PortalOrganizationSummary,
  PortalReviewSchemeSummary,
  PortalTreeDictionarySummary,
  PortalUserSummary,
} from '../dto/portal-reference-data.response';
import { QueryPortalCommonDto } from '../dto/query-portal-common.dto';
import { QueryPortalDictionariesDto } from '../dto/query-portal-dictionaries.dto';
import { QueryPortalTreeDictionariesDto } from '../dto/query-portal-tree-dictionaries.dto';
import { QueryPortalUsersDto } from '../dto/query-portal-users.dto';
import { PortalReferenceDataService } from '../services/portal-reference-data.service';

@Controller('portal/reference-data')
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles('project_owner', 'expert', 'review_manager', 'client', 'admin')
export class PortalReferenceDataController {
  constructor(
    private readonly portalReferenceDataService: PortalReferenceDataService,
  ) {}

  @Get('dictionaries')
  listDictionaries(
    @Query() query: QueryPortalDictionariesDto,
  ): Promise<PortalListResponse<PortalDictionarySummary>> {
    return this.portalReferenceDataService.listDictionaries(query);
  }

  @Get('tree-dictionaries')
  listTreeDictionaries(
    @Query() query: QueryPortalTreeDictionariesDto,
  ): Promise<PortalListResponse<PortalTreeDictionarySummary>> {
    return this.portalReferenceDataService.listTreeDictionaries(query);
  }

  @Get('batches')
  listBatches(
    @Query() query: QueryPortalCommonDto,
  ): Promise<PortalListResponse<PortalBatchSummary>> {
    return this.portalReferenceDataService.listBatches(query);
  }

  @Get('organizations')
  listOrganizations(
    @Query() query: QueryPortalCommonDto,
  ): Promise<PortalListResponse<PortalOrganizationSummary>> {
    return this.portalReferenceDataService.listOrganizations(query);
  }

  @Get('review-schemes')
  listReviewSchemes(
    @Query() query: QueryPortalCommonDto,
  ): Promise<PortalListResponse<PortalReviewSchemeSummary>> {
    return this.portalReferenceDataService.listReviewSchemes(query);
  }

  @Get('users')
  listUsers(
    @Query() query: QueryPortalUsersDto,
  ): Promise<PortalListResponse<PortalUserSummary>> {
    return this.portalReferenceDataService.listUsers(query);
  }
}
