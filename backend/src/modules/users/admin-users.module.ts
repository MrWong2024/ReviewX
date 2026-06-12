import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AdminUsersController } from './controllers/admin-users.controller';
import { UsersModule } from './users.module';

@Module({
  imports: [AuthModule, UsersModule],
  controllers: [AdminUsersController],
})
export class AdminUsersModule {}
