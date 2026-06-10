import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { SessionAuthGuard } from '../../auth/guards/session-auth.guard';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import { QueryProjectImportJobsDto } from '../dto/query-project-import-jobs.dto';
import { QueryProjectImportRowsDto } from '../dto/query-project-import-rows.dto';
import { UpdateProjectImportRowDto } from '../dto/update-project-import-row.dto';
import { UploadProjectImportDto } from '../dto/upload-project-import.dto';
import {
  PROJECT_IMPORT_MAX_FILE_SIZE_BYTES,
  ProjectImportsService,
  UploadedProjectImportFile,
} from '../services/project-imports.service';

@Controller('admin/project-imports')
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles('admin')
export class ProjectImportsController {
  constructor(private readonly projectImportsService: ProjectImportsService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: PROJECT_IMPORT_MAX_FILE_SIZE_BYTES },
    }),
  )
  upload(
    @UploadedFile() file: UploadedProjectImportFile | undefined,
    @Body() dto: UploadProjectImportDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.projectImportsService.upload({
      file,
      batchId: dto.batchId,
      uploadedByUserId: currentUser.user.id,
    });
  }

  @Get()
  list(@Query() query: QueryProjectImportJobsDto) {
    return this.projectImportsService.listJobs(query);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.projectImportsService.findJobById(id);
  }

  @Get(':id/rows')
  listRows(@Param('id') id: string, @Query() query: QueryProjectImportRowsDto) {
    return this.projectImportsService.listRows(id, query);
  }

  @Patch(':id/rows/:rowId')
  updateRow(
    @Param('id') id: string,
    @Param('rowId') rowId: string,
    @Body() dto: UpdateProjectImportRowDto,
  ) {
    return this.projectImportsService.updateRow(id, rowId, dto);
  }

  @Post(':id/rows/:rowId/confirm')
  confirmRow(
    @Param('id') id: string,
    @Param('rowId') rowId: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.projectImportsService.confirmRow({
      jobId: id,
      rowId,
      confirmedByUserId: currentUser.user.id,
    });
  }

  @Post(':id/confirm')
  confirmJob(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.projectImportsService.confirmJob({
      jobId: id,
      confirmedByUserId: currentUser.user.id,
    });
  }

  @Post(':id/rows/:rowId/skip')
  skipRow(@Param('id') id: string, @Param('rowId') rowId: string) {
    return this.projectImportsService.skipRow(id, rowId);
  }
}
