import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import { User } from '../users/entities/user.entity';
// Import necessary Sequelize types (if not already globally available)
import { Transaction } from 'sequelize';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectModel(User)
    private readonly userModel: typeof User,
  ) {
    const publicKey = configService.get<string>('JWT_PUBLIC_KEY');
    if (!publicKey) {
      throw new Error('JWT_PUBLIC_KEY is not set in environment variables');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: publicKey.replace(/\\n/g, '\n'),
      algorithms: ['RS256'],
    });
  }

  async validate(payload: {
    sub: string;
    email: string;
    role?: 'user' | 'admin';
    tv?: number;
  }) {
    const userId = parseInt(payload.sub, 10);
    if (isNaN(userId)) {
      throw new UnauthorizedException('Invalid token subject.');
    }

    
    const user = await this.userModel.findByPk(userId, {
      attributes: {
        include: ['tokenVersion'],
        exclude: ['password']
      },
    
      useMaster: true,
      
    });
console.log('[DB RAW CHECK] User tokenVersion directly from findByPk:', user?.tokenVersion);
   
    if (!user) {
      throw new UnauthorizedException('User not found or token is invalid.');
    }
    console.log(`[JWT Validation] User ${user.id} - Token Version: JWT=${payload.tv}, DB=${user.tokenVersion}`);

    if (payload.tv !== user.tokenVersion) {
      console.log(`[JWT Validation] Token version mismatch for user ${user.id}`);
      throw new UnauthorizedException('Token has been revoked. Please log in again.');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role as 'user' | 'admin',
    };
  }
}