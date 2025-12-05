import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuthService } from './auth.service';
import { EmailModule } from '../../email/email.module';
import { User } from '../users/entities/user.entity';
import { RefreshToken } from '../users/entities/refresh-token.entity';
import { Client } from '../clients/entities/client.entity';
import { ClientAppToken } from './entities/client-app-token.entity';
import { AuthorizationCode } from './entities/authorization-code.entity';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwksModule } from '../jwks/jwks.module';
import { LinkedInStrategy } from './strategies/linkedin.strategy';

@Module({
  imports: [
    SequelizeModule.forFeature([
      User,
      RefreshToken,
      Client,
      ClientAppToken,
      AuthorizationCode,
    ]),
    EmailModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwksModule,
    PassportModule.register({
      defaultStrategy: 'jwt',
      session: false,
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtAuthGuard, LinkedInStrategy],
  exports: [JwtAuthGuard, AuthService, PassportModule],
})
export class AuthModule {}
