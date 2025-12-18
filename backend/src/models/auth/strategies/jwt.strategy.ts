import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectModel } from '@nestjs/sequelize';
import { BlacklistedToken } from '../../users/entities/blacklisted-token.entity';
import { User } from '../../users/entities/user.entity';
import { Request } from 'express';

interface JwtPayload {
  sub: string;
  role: string;
  tokenVersion: number;
  iat?: number;
  exp?: number;
}

interface ValidatedUser {
  id: number;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectModel(BlacklistedToken)
    private readonly blacklistedTokenModel: typeof BlacklistedToken,
    @InjectModel(User)
    private readonly userModel: typeof User,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_PUBLIC_KEY!.replace(/\\n/g, '\n'),
      algorithms: ['RS256'],
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: JwtPayload): Promise<ValidatedUser> {
    const userId = parseInt(payload.sub, 10);

    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new UnauthorizedException('No authorization header found');
    }

    const token = authHeader.replace('Bearer ', '');

    // Check if token is blacklisted
    const blacklistedToken = await this.blacklistedTokenModel.findOne({
      where: { token },
    });

    if (blacklistedToken) {
      throw new UnauthorizedException('Token has been revoked');
    }

    // Check token version
    const user = await this.userModel.findByPk(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (payload.tokenVersion !== user.tokenVersion) {
      throw new UnauthorizedException('Token version mismatch - please login again');
    }

    return {
      id: userId,
      role: payload.role,
    };
  }
}
