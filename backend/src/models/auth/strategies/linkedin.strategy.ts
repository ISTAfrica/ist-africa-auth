import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, StrategyOptions } from 'passport-oauth2';

@Injectable()
export class LinkedInStrategy extends PassportStrategy(Strategy, 'linkedin') {
  constructor() {
    const options: StrategyOptions = {
      authorizationURL: 'https://www.linkedin.com/oauth/v2/authorization',
      tokenURL: 'https://www.linkedin.com/oauth/v2/accessToken',
      clientID: process.env.LINKEDIN_CLIENT_ID!,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
      callbackURL: process.env.LINKEDIN_CALLBACK_URL!,
      scope: ['openid', 'profile', 'email'],
      state: true,
    } as StrategyOptions;

    super(options);
  }

  async validate(accessToken: string, refreshToken: string): Promise<any> {
    // Fetch user profile from LinkedIn's OpenID Connect userinfo endpoint
    const response = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('LinkedIn userinfo error:', errorText);
      throw new Error('Failed to fetch LinkedIn user profile');
    }

    interface LinkedInProfile {
      sub: string;
      email: string;
      given_name: string;
      family_name: string;
      picture?: string;
    }

    const profile = (await response.json()) as LinkedInProfile;

    return {
      linkedinId: profile.sub,
      email: profile.email,
      firstName: profile.given_name,
      lastName: profile.family_name,
      picture: profile.picture,
    };
  }
}
