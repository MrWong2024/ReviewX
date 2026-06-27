import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { QueryClientDashboardOverviewDto } from './query-client-dashboard-overview.dto';

export class QueryClientDashboardProjectsDto extends QueryClientDashboardOverviewDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  pageSize = 100;
}
