import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuthService } from './auth.service';
import { EmailModule } from '../../email/email.module';
import { User } from '../users/entities/user.entity';
import { RefreshToken } from '../users/entities/refresh-token.entity';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [SequelizeModule.forFeature([User, RefreshToken]), EmailModule],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtAuthGuard],
  exports: [JwtAuthGuard],
})
export class AuthModule {}
