// src/models/auth/jwt.strategy.ts

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
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

  /**
   * This method is called by Passport AFTER the token signature has been successfully verified.
   * Your job is to take the decoded payload and return the corresponding user from the database.
   */
  async validate(payload: { sub: string; email: string }) { // <-- 1. Correct the payload type to string
  const userId = parseInt(payload.sub, 10); // <-- 2. Convert the string to an integer

  if (isNaN(userId)) {
    throw new UnauthorizedException('Invalid token subject.');
  }

  const user = await this.prisma.user.findUnique({
    where: { id: userId }, // <-- 3. Use the converted integer
  });

  if (!user) {
    throw new UnauthorizedException('User not found or token is invalid.');
  }

  return user;
}
}