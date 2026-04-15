import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { BlacklistedToken } from './entities/blacklisted-token.entity';
import { ClientUser } from '../auth/entities/client-user.entity';
import { Client } from '../clients/entities/client.entity';
import { EmailModule } from 'src/email/email.module';

@Module({
  imports: [SequelizeModule.forFeature([User, BlacklistedToken, ClientUser, Client]),
  EmailModule,
],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],

})
export class UsersModule {}
