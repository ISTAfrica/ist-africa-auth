// src/models/auth/strategies/linkedin.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, StrategyOptions } from 'passport-oauth2';
import { ConfigService } from '@nestjs/config';
import * as https from 'https';

@Injectable()
export class LinkedInStrategy extends PassportStrategy(Strategy, 'linkedin') {
  constructor(private configService: ConfigService) {
    const options: StrategyOptions = {
      authorizationURL: 'https://www.linkedin.com/oauth/v2/authorization',
      tokenURL: 'https://www.linkedin.com/oauth/v2/accessToken',
      clientID: configService.get<string>('LINKEDIN_CLIENT_ID')!,
      clientSecret: configService.get<string>('LINKEDIN_CLIENT_SECRET')!,
      callbackURL: configService.get<string>('LINKEDIN_CALLBACK_URL')!,
      scope: ['openid', 'profile', 'email'],
      state: true,
      passReqToCallback: true, // CRITICAL: This allows us to access the request in validate()
    };

    super(options);

    console.log('=== LINKEDIN STRATEGY INITIALIZED ===');
    console.log('Authorization URL:', options.authorizationURL);
    console.log('Callback URL:', options.callbackURL);
    console.log('Client ID:', options.clientID ? 'Set' : 'Missing');
    console.log('Client Secret:', options.clientSecret ? 'Set' : 'Missing');
  }

  /**
   * Fetches the LinkedIn userinfo endpoint using Node's https module
   * with family:4 (IPv4) to avoid IPv6 connectivity issues in Docker.
   */
  private fetchLinkedInProfile(accessToken: string): Promise<Record<string, unknown>> {
    return new Promise((resolve, reject) => {
      const req = https.get(
        'https://api.linkedin.com/v2/userinfo',
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          family: 4,
          timeout: 15000,
        },
        (res) => {
          let body = '';
          res.on('data', (chunk: string) => { body += chunk; });
          res.on('end', () => {
            if (!res.statusCode || res.statusCode >= 400) {
              console.error('[LinkedInStrategy] LinkedIn API error:', body);
              return reject(new Error(`LinkedIn API ${res.statusCode}: ${body}`));
            }
            try {
              resolve(JSON.parse(body));
            } catch {
              reject(new Error('Failed to parse LinkedIn profile response'));
            }
          });
        },
      );
      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('LinkedIn API request timed out'));
      });
    });
  }

  async validate(
    req: any,
    accessToken: string,
    refreshToken: string,
    profile: any,
  ): Promise<any> {
    console.log('=== LINKEDIN STRATEGY VALIDATE ===');
    console.log('Access Token received:', accessToken ? 'Yes' : 'No');

    try {
      const userProfile = await this.fetchLinkedInProfile(accessToken);
      console.log('LinkedIn profile fetched:', userProfile.email);

      // LinkedIn OpenID Connect returns picture in the 'picture' field
      const userData = {
        linkedinId: userProfile.sub,
        email: userProfile.email,
        firstName: userProfile.given_name || '',
        lastName: userProfile.family_name || '',
        picture:
          userProfile.picture ||
          userProfile.profilePicture ||
          userProfile.photo ||
          null,
      };

      console.log('User data prepared:', userData.email);
      return userData;
    } catch (error) {
      console.error(
        '[LinkedInStrategy] ========== ERROR IN VALIDATE ==========',
      );
      console.error(error);
      throw error;
    }
  }
}
