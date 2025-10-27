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

  
  async validate(payload: { sub: string; email: string }) { 
  const userId = parseInt(payload.sub, 10); 

  if (isNaN(userId)) {
    throw new UnauthorizedException('Invalid token subject.');
  }

  const user = await this.prisma.user.findUnique({
    where: { id: userId }, 
  });

  if (!user) {
    throw new UnauthorizedException('User not found or token is invalid.');
  }

  return user;
}
}