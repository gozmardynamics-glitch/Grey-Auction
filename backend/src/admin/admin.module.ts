import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Admin } from './entities/admin.entity';
import { AdminRolesGuard } from './guards/admin-roles.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Admin])],
  providers: [AdminRolesGuard],
  exports: [AdminRolesGuard, TypeOrmModule],
})
export class AdminModule {}
