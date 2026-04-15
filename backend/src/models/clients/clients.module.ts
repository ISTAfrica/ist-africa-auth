import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ClientsService } from './clients.service';
import { ClientsController } from './clients.controller';
import { Client } from './entities/client.entity';
import { AuthModule } from '../auth/auth.module';
import { ClientUser } from '../auth/entities/client-user.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [SequelizeModule.forFeature([Client, ClientUser, User]), AuthModule,],
  controllers: [ClientsController],
  providers: [ClientsService],
})
export class ClientsModule {}