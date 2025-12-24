import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { BlacklistedToken } from './entities/blacklisted-token.entity';
import { EmailModule } from 'src/email/email.module';

@Module({
  imports: [SequelizeModule.forFeature([User, BlacklistedToken]),
  EmailModule,
],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],

})
export class UsersModule {}
