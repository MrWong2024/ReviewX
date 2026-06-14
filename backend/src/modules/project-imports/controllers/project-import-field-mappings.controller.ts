import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
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
import type {
  ProjectImportFieldMappingResponse,
  ProjectImportFieldMappingsResponse,
  ProjectImportStandardFieldsResponse,
} from '../dto/project-import-field-mapping.response';
import { QueryProjectImportFieldMappingsDto } from '../dto/query-project-import-field-mappings.dto';
import { UpdateProjectImportFieldMappingDto } from '../dto/update-project-import-field-mapping.dto';
import { UpsertProjectImportFieldMappingDto } from '../dto/upsert-project-import-field-mapping.dto';
import { ProjectImportFieldMappingsService } from '../services/project-import-field-mappings.service';

@Controller('admin/project-import-field-mappings')
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles('admin')
export class ProjectImportFieldMappingsController {
  constructor(
    private readonly fieldMappingsService: ProjectImportFieldMappingsService,
  ) {}

  @Get('standard-fields')
  listStandardFields(): ProjectImportStandardFieldsResponse {
    return this.fieldMappingsService.listStandardFields();
  }

  @Get()
  list(
    @Query() query: QueryProjectImportFieldMappingsDto,
  ): Promise<ProjectImportFieldMappingsResponse> {
    return this.fieldMappingsService.list(query);
  }

  @Get(':standardField')
  findByStandardField(
    @Param('standardField') standardField: string,
  ): Promise<ProjectImportFieldMappingResponse> {
    return this.fieldMappingsService.findByStandardField(standardField);
  }

  @Put(':standardField')
  upsert(
    @Param('standardField') standardField: string,
    @Body() dto: UpsertProjectImportFieldMappingDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<ProjectImportFieldMappingResponse> {
    return this.fieldMappingsService.upsert(
      standardField,
      dto,
      currentUser.user.id,
    );
  }

  @Patch(':standardField')
  update(
    @Param('standardField') standardField: string,
    @Body() dto: UpdateProjectImportFieldMappingDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<ProjectImportFieldMappingResponse> {
    return this.fieldMappingsService.update(
      standardField,
      dto,
      currentUser.user.id,
    );
  }

  @Delete(':standardField')
  remove(
    @Param('standardField') standardField: string,
  ): Promise<{ success: true }> {
    return this.fieldMappingsService.remove(standardField);
  }

  @Post(':standardField/reset-defaults')
  resetDefaults(
    @Param('standardField') standardField: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<ProjectImportFieldMappingResponse> {
    return this.fieldMappingsService.resetDefaults(
      standardField,
      currentUser.user.id,
    );
  }
}
