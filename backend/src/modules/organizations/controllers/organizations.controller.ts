import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { SessionAuthGuard } from '../../auth/guards/session-auth.guard';
import { CreateOrganizationDto } from '../dto/create-organization.dto';
import { QueryOrganizationsDto } from '../dto/query-organizations.dto';
import { UpdateOrganizationDto } from '../dto/update-organization.dto';
import {
  OrganizationResponse,
  OrganizationsService,
} from '../services/organizations.service';

@Controller('admin/organizations')
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles('admin')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  create(@Body() dto: CreateOrganizationDto): Promise<OrganizationResponse> {
    return this.organizationsService.create(dto);
  }

  @Get()
  list(@Query() query: QueryOrganizationsDto) {
    return this.organizationsService.list(query);
  }

  @Get(':id')
  findById(@Param('id') id: string): Promise<OrganizationResponse> {
    return this.organizationsService.findById(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateOrganizationDto,
  ): Promise<OrganizationResponse> {
    return this.organizationsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<OrganizationResponse> {
    return this.organizationsService.remove(id);
  }
}
