import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ClientsService } from './clients.service';
import { ClientsController } from './clients.controller';
import { Client } from './entities/client.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [SequelizeModule.forFeature([Client]), AuthModule,],
  controllers: [ClientsController],
  providers: [ClientsService],
})
export class ClientsModule {}