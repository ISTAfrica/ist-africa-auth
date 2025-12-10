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
    } as StrategyOptions;
    super(options);
  }

  async validate(accessToken: string): Promise<any> {
    try {
      console.log('=== LinkedIn Strategy Validate ===');
      console.log('Access Token:', accessToken ? '✓ Present' : '✗ Missing');

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

      const profile = await response.json();

      console.log('=== RAW LinkedIn Profile Response ===');
      console.log(JSON.stringify(profile, null, 2));
      console.log('=====================================');

      // LinkedIn OpenID Connect returns picture in the 'picture' field
      const userData = {
        linkedinId: profile.sub,
        email: profile.email,
        firstName: profile.given_name || '',
        lastName: profile.family_name || '',
        // Try multiple possible field names for the profile picture
        picture:
          profile.picture || profile.profilePicture || profile.photo || null,
      };

      console.log('=== Processed User Data ===');
      console.log('LinkedIn ID:', userData.linkedinId);
      console.log('Email:', userData.email);
      console.log('First Name:', userData.firstName);
      console.log('Last Name:', userData.lastName);
      console.log('Picture URL:', userData.picture);
      console.log('Picture found:', userData.picture ? '✓ YES' : '✗ NO');
      console.log('===========================');

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
