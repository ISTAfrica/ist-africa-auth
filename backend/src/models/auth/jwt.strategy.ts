import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import { User } from '../users/entities/user.entity'; 

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

  async validate(payload: { sub: string }) {
  async validate(payload: { sub: string; email: string; role?: 'user' | 'admin' }) {
    const userId = parseInt(payload.sub, 10);
    if (isNaN(userId)) {
      throw new UnauthorizedException('Invalid token subject.');
    }

    const user = await this.userModel.findByPk(userId);
    const user = await this.userModel.findByPk(userId, {
      attributes: { exclude: ['password'] },
    });

    if (!user) {
      throw new UnauthorizedException('User not found or token is invalid.');
    }

    console.log('USER RETURNED FROM STRATEGY:', user.toJSON()); 
    return user;
    return {
      id: user.id,
      email: user.email,
      role: user.role as 'user' | 'admin', 
    };
  }
}