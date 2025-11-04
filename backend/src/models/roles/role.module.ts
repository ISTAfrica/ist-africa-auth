// src/models/roles/role.module.ts
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { UserRole } from './entities/user.role.entity';
import { RoleService } from './role.service';
import { RoleController } from './role.controller';

@Module({
  imports: [SequelizeModule.forFeature([UserRole])],
  controllers: [RoleController],
  providers: [RoleService],
  exports: [SequelizeModule, RoleService],
})
export class RoleModule {}
