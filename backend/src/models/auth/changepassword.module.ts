import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ChangePasswordController } from './changepassword.controller';
import { ChangePasswordService } from './changepassword.service';
import { User } from '../users/entities/user.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [SequelizeModule.forFeature([User]), UsersModule],
  controllers: [ChangePasswordController],
  providers: [ChangePasswordService],
  exports: [ChangePasswordService],
})
export class ChangePasswordModule {}
