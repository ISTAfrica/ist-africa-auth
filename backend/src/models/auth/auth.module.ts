import { Module, Global } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuthService } from './auth.service';
import { EmailModule } from '../../email/email.module';
import { User } from '../users/entities/user.entity';
import { RefreshToken } from '../users/entities/refresh-token.entity';
import { BlacklistedToken } from '../users/entities/blacklisted-token.entity';
import { Client } from '../clients/entities/client.entity';
import { ClientAppToken } from './entities/client-app-token.entity';
import { AuthorizationCode } from './entities/authorization-code.entity';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwksModule } from '../jwks/jwks.module';
import { LinkedInStrategy } from './strategies/linkedin.strategy';

import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Global()
@Module({
  imports: [
    SequelizeModule.forFeature([
      User,
      RefreshToken,
      BlacklistedToken,
      Client,
      ClientAppToken,
      AuthorizationCode,
    ]),
    EmailModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwksModule,

    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        
        const privateKey = configService
          .get<string>('JWT_PRIVATE_KEY', '')
          .replace(/\\n/g, '\n');

        const publicKey = configService
          .get<string>('JWT_PUBLIC_KEY', '')
          .replace(/\\n/g, '\n');

        if (!privateKey || !publicKey) {
          throw new Error('JWT private or public key is not defined in environment variables.');
        }

        return {
          privateKey,
          publicKey,
          signOptions: {
            algorithm: 'RS256',
            expiresIn: configService.get('JWT_EXPIRES_IN', '1h'), 
            issuer: 'https://auth.ist.africa',
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService, 
    JwtStrategy,
    JwtAuthGuard, 
    LinkedInStrategy
  ],
  exports: [JwtAuthGuard, AuthService, PassportModule],
})
export class AuthModule {}