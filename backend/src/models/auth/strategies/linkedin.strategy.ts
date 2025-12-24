// src/models/auth/strategies/linkedin.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, StrategyOptions } from 'passport-oauth2';
import { ConfigService } from '@nestjs/config';

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

  async validate(
    req: any,
    accessToken: string,
    refreshToken: string,
    profile: any,
  ): Promise<any> {
    console.log('=== LINKEDIN STRATEGY VALIDATE ===');
    console.log('Access Token received:', accessToken ? 'Yes' : 'No');

    try {
      const response = await fetch('https://api.linkedin.com/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          '[LinkedInStrategy] LinkedIn API error response:',
          errorText,
        );
        throw new Error(
          `Failed to fetch LinkedIn user profile: ${response.status} - ${errorText}`,
        );
      }

      const userProfile = await response.json();
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
