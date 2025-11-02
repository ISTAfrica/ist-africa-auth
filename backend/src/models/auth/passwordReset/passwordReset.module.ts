import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ConfigModule } from '@nestjs/config';
import { PasswordResetService } from './passwordReset.service';
import { PasswordResetController } from './passwordReset.controller';
import { User } from '../../users/entities/user.entity';
import { PasswordResetToken } from './entities/password-reset-token.model';
import { EmailResetModule } from './resetEmail/restEmail.module';

@Module({
  imports: [
    SequelizeModule.forFeature([User, PasswordResetToken]),
    EmailResetModule,
    ConfigModule,
  ],
  controllers: [PasswordResetController],
  providers: [PasswordResetService],
})
export class PasswordResetModule {}
