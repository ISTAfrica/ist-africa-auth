import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from '../../../models/users/entities/user.entity';
import { DefaultAdminService } from './default-admin.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    SequelizeModule.forFeature([User]), // allows injection of User model
    ConfigModule,
  ],
  providers: [DefaultAdminService],
  exports: [DefaultAdminService], // export in case other modules need it
})
export class DefaultAdminModule {}
