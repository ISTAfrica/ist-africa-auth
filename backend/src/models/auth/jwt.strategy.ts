import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import { User } from '../users/entities/user.entity'; // Adjust path if necessary

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

  /**
   * This method is called by Passport to validate the JWT payload.
   * It finds the user in the database based on the subject (sub) claim.
   * @param payload The decoded JWT payload.
   * @returns The full user object if validation is successful.
   */
  async validate(payload: { sub: string; email: string }) {
    const userId = parseInt(payload.sub, 10);
    if (isNaN(userId)) {
      throw new UnauthorizedException('Invalid token subject.');
    }

    // Load user with role relation so downstream guards can check role
    const user = await this.userModel.findByPk(userId, {
      include: [{ association: 'role' }],
      attributes: { exclude: ['password'] },
    });

    if (!user) {
      throw new UnauthorizedException('User not found or token is invalid.');
    }

    // Attach a minimal, serializable user to req.user
    return {
      id: user.id,
      email: user.email,
      role: user.role ? user.role.name : undefined,
    };
  }
}
