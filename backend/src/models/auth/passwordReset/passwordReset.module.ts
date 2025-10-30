import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { PasswordResetService } from './passwordReset.service';
import { PasswordResetController } from './passwordReset.controller';
import { User } from '../../users/entities/user.entity';
import { PasswordResetToken } from './entities/password-reset-token.model';
import { EmailModule } from '../../../email/email.module';

@Module({
  imports: [
    SequelizeModule.forFeature([User, PasswordResetToken]),
    EmailModule,
  ],
  controllers: [PasswordResetController],
  providers: [PasswordResetService],
})
export class PasswordResetModule {}
