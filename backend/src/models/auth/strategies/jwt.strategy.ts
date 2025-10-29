import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

interface JwtPayload {
  sub: string;
  user_type: string;
  iat?: number;
  exp?: number;
}

interface ValidatedUser {
  id: number;
  user_type: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_PUBLIC_KEY!.replace(/\\n/g, '\n'),
      algorithms: ['RS256'],
    });
  }

  validate(payload: JwtPayload): ValidatedUser {
    return {
      id: parseInt(payload.sub, 10),
      user_type: payload.user_type,
    };
  }
}
