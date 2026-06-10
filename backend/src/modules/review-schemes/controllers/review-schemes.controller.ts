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
import { CreateReviewSchemeDto } from '../dto/create-review-scheme.dto';
import { QueryReviewSchemesDto } from '../dto/query-review-schemes.dto';
import { UpdateReviewSchemeDto } from '../dto/update-review-scheme.dto';
import {
  ReviewSchemeResponse,
  ReviewSchemesService,
} from '../services/review-schemes.service';

@Controller('admin/review-schemes')
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles('admin')
export class ReviewSchemesController {
  constructor(private readonly reviewSchemesService: ReviewSchemesService) {}

  @Post()
  create(@Body() dto: CreateReviewSchemeDto): Promise<ReviewSchemeResponse> {
    return this.reviewSchemesService.create(dto);
  }

  @Get()
  list(@Query() query: QueryReviewSchemesDto) {
    return this.reviewSchemesService.list(query);
  }

  @Get(':id')
  findById(@Param('id') id: string): Promise<ReviewSchemeResponse> {
    return this.reviewSchemesService.findById(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateReviewSchemeDto,
  ): Promise<ReviewSchemeResponse> {
    return this.reviewSchemesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<ReviewSchemeResponse> {
    return this.reviewSchemesService.remove(id);
  }
}
