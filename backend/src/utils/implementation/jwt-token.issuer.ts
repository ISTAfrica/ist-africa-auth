import { JwtTokenIssuer, JwtTokenRequest, JwtTokenResponse, DeviceInfo } from '../token';
import { ConfigService } from '@nestjs/config';
import { RefreshToken } from '../../models/users/entities/refresh-token.entity';
import { hash } from 'bcryptjs';
import { randomUUID } from 'crypto';

export class JwtTokenIssuerImpl implements JwtTokenIssuer {
  constructor(
    private readonly configService: ConfigService,
    private readonly refreshTokenModel: typeof RefreshToken,
  ) { }

  async issueTokens(payload: JwtTokenRequest): Promise<JwtTokenResponse> {
    const { SignJWT, importPKCS8 } = await import('jose');

    const privateKeyPem = this.configService.get<string>('JWT_PRIVATE_KEY');
    if (!privateKeyPem) {
      throw new Error('JWT_PRIVATE_KEY is not configured');
    }

    const privateKey = await importPKCS8(
      privateKeyPem.replace(/\\n/g, '\n'),
      'RS256',
    );
    const keyId = this.configService.get<string>('JWT_KEY_ID');
    if (!keyId) {
      throw new Error('JWT_KEY_ID is not configured');
    }

    const issuer = this.configService.get<string>('JWT_ISSUER');
    if (!issuer) {
      throw new Error('JWT_ISSUER is not configured');
    }

    const defaultAudience = this.configService.get<string>('JWT_DEFAULT_AUDIENCE');
    if (!defaultAudience) {
      throw new Error('JWT_DEFAULT_AUDIENCE is not configured');
    }


    const accessExpiration = this.resolveAccessExpiration();
    const isClientToken =
      Boolean(payload.auth_code) &&
      Boolean(payload.client_id) &&
      Boolean(payload.client_secret) &&
      Boolean(payload.userId);

    const claims: Record<string, unknown> = {
      sub: payload.userId,
      email: payload.email,
      role: payload.role,
      tokenVersion: payload.tokenVersion,
    };

    if (payload.name) {
      claims.name = payload.name;
    }

    if (isClientToken && payload.client_id && payload.auth_code) {
      claims.client_id = payload.client_id;
      claims.auth_code = payload.auth_code;
    }

    const accessToken = await new SignJWT(claims)
      .setProtectedHeader({ alg: 'RS256', kid: keyId })
      .setIssuer(issuer)
      .setAudience(
        isClientToken && payload.client_id ? payload.client_id : defaultAudience,
      )
      .setSubject(payload.userId)
      .setIssuedAt()
      .setExpirationTime(accessExpiration)
      .sign(privateKey);

    const refreshToken = await this.createAndStoreRefreshToken(payload.userId, payload.deviceInfo);

    return {
      accessToken,
      refreshToken,
    };
  }

  private resolveAccessExpiration(): string {
    const ttl = this.configService.get<string>('ACCESS_TOKEN_TTL_SECONDS') || '3600';
    return `${ttl}s`;
  }

  private async createAndStoreRefreshToken(userId: string, deviceInfo?: DeviceInfo | null): Promise<string> {
    const refreshToken = randomUUID();
    const hashedRefresh = await hash(refreshToken, 12);

    const ttlDays = Number(this.configService.get<string>('REFRESH_TOKEN_TTL_DAYS')) || 30;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + ttlDays);

    await this.refreshTokenModel.create({
      hashedToken: hashedRefresh,
      userId,
      expiresAt,
      browser: deviceInfo?.browser ?? null,
      os: deviceInfo?.os ?? null,
      deviceType: deviceInfo?.deviceType ?? null,
      ipAddress: deviceInfo?.ipAddress ?? null,
      lastActiveAt: new Date(),
    });

    return refreshToken;
  }
}


