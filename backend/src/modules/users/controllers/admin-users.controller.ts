import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { SessionAuthGuard } from '../../auth/guards/session-auth.guard';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.type';
import { CreateAdminUserDto } from '../dto/create-admin-user.dto';
import { QueryAdminUsersDto } from '../dto/query-admin-users.dto';
import { ResetAdminUserPasswordDto } from '../dto/reset-admin-user-password.dto';
import { UpdateAdminUserStatusDto } from '../dto/update-admin-user-status.dto';
import { UpdateAdminUserDto } from '../dto/update-admin-user.dto';
import { AdminUserResponse, UsersService } from '../users.service';

@Controller('admin/users')
@UseGuards(SessionAuthGuard, RolesGuard)
@Roles('admin')
export class AdminUsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  list(@Query() query: QueryAdminUsersDto) {
    return this.usersService.listAdminUsers(query);
  }

  @Post()
  create(@Body() dto: CreateAdminUserDto): Promise<AdminUserResponse> {
    return this.usersService.createAdminUser(dto);
  }

  @Get(':id')
  findById(@Param('id') id: string): Promise<AdminUserResponse> {
    return this.usersService.findAdminUserById(id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateAdminUserStatusDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<AdminUserResponse> {
    return this.usersService.updateAdminUserStatus(id, dto, currentUser);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAdminUserDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<AdminUserResponse> {
    return this.usersService.updateAdminUser(id, dto, currentUser);
  }

  @Post(':id/reset-password')
  resetPassword(
    @Param('id') id: string,
    @Body() dto: ResetAdminUserPasswordDto,
  ): Promise<AdminUserResponse> {
    return this.usersService.resetAdminUserPassword(id, dto);
  }
}
