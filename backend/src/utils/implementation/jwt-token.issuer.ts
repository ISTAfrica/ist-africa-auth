import { JwtTokenIssuer, JwtTokenRequest, JwtTokenResponse } from '../token';
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
      sub: payload.userId.toString(),
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
      .setSubject(payload.userId.toString())
      .setIssuedAt()
      .setExpirationTime(accessExpiration)
      .sign(privateKey);

    const refreshToken = await this.createAndStoreRefreshToken(payload.userId);

    return {
      accessToken,
      refreshToken,
    };
  }

  private resolveAccessExpiration(): string {
    const configured =
      this.configService.get<string>('JWT_ACCESS_TOKEN_EXPIRATION') ?? null;

    if (configured && configured.trim().length > 0) {
      return configured.trim();
    }

    const ttlSecondsRaw =
      this.configService.get<string>('ACCESS_TOKEN_TTL_SECONDS') ??
      this.configService.get<string>('ACCESS_TOKEN_TTL');
    const ttlSeconds = ttlSecondsRaw ? Number(ttlSecondsRaw) : 3600;

    const safeSeconds =
      Number.isNaN(ttlSeconds) || ttlSeconds <= 0 ? 3600 : ttlSeconds;

    return `${safeSeconds}s`;
  }

  private async createAndStoreRefreshToken(userId: number): Promise<string> {
    const refreshToken = randomUUID();
    const hashedRefresh = await hash(refreshToken, 12);

    const ttlDaysRaw =
      this.configService.get<string>('JWT_REFRESH_TOKEN_EXPIRATION_DAYS') ??
      this.configService.get<string>('REFRESH_TOKEN_TTL_DAYS');
    const ttlDays = ttlDaysRaw ? Number(ttlDaysRaw) : 30;
    const expiresAt = new Date();
    const safeTtlDays = Number.isNaN(ttlDays) ? 30 : ttlDays;
    expiresAt.setDate(expiresAt.getDate() + safeTtlDays);

    await this.refreshTokenModel.create({
      hashedToken: hashedRefresh,
      userId,
      expiresAt,
    });

    return refreshToken;
  }
}


