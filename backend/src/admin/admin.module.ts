import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Admin } from './entities/admin.entity';
import { User } from '../auth/entities/user.entity';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { AdminRolesGuard } from './guards/admin-roles.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Admin, User])],
  controllers: [AdminController],
  providers: [AdminService, AdminRolesGuard],
  exports: [AdminService, AdminRolesGuard, TypeOrmModule],
})
export class AdminModule {}
