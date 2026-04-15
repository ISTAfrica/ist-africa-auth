import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { User } from '../users/entities/user.entity';
import { ClientUser } from '../auth/entities/client-user.entity';
import { Client } from '../clients/entities/client.entity';

@Module({
  imports: [SequelizeModule.forFeature([User, ClientUser, Client])],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
