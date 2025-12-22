import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwksService {
  constructor(private readonly configService: ConfigService, private readonly jwtService: JwtService) {}

  async getJwks() {
    try {
      const { importSPKI, exportJWK } = await import('jose');

      const publicKeyPem = this.configService
        .get<string>('JWT_PUBLIC_KEY', '')
        .replace(/\\n/g, '\n');
        
      const keyId = this.configService.get<string>('JWT_KEY_ID');

      if (!publicKeyPem || !keyId) {
        throw new Error('JWT_PUBLIC_KEY or JWT_KEY_ID is not configured in environment variables.');
      }

      const ecPublicKey = await importSPKI(publicKeyPem, 'RS256');
      const jwk = await exportJWK(ecPublicKey);

      return {
        keys: [{ ...jwk, kid: keyId, use: 'sig', alg: 'RS256' }],
      };
    } catch (error) {
      console.error('JWKS Generation Error:', error);
      throw new InternalServerErrorException('Could not generate JWKS');
    }
  }

  async introspectToken(token: string): Promise<{ active: boolean; [key: string]: any }> {
    try {
      // Use NestJS's built-in JWT validation. This method will automatically
      // use the secret/public keys you configured in your AuthModule's JwtModule.
      const payload = await this.jwtService.verifyAsync(token);

      // If verification succeeds, the token is active.
      return {
        active: true,
        ...payload, // Include all claims from the token (sub, email, exp, etc.)
      };
    } catch (error) {
      // If verifyAsync throws an error (e.g., bad signature, expired token),
      // it means the token is not active.
      console.error('[Introspection Service] Token validation failed:', error.message);
      return { active: false };
    }
  }

}