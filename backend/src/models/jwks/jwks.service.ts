import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwksService {
  constructor(private readonly configService: ConfigService) {}

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
}