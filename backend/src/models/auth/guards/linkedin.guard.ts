import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

interface OAuthSession {
  oauth?: {
    client_id: string;
    redirect_uri: string;
    state?: string;
  };
}

@Injectable()
export class LinkedInOAuthGuard extends AuthGuard('linkedin') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { session: OAuthSession }>();

    // Store OAuth params BEFORE Passport redirect
    const { client_id, redirect_uri, state } = request.query;

    console.log('=== LINKEDIN OAUTH GUARD ===');
    console.log('Query params:', { client_id, redirect_uri, state });

    if (client_id && redirect_uri) {
      request.session = request.session || {};
      request.session.oauth = {
        client_id: client_id as string,
        redirect_uri: redirect_uri as string,
        state: state as string,
      };

      console.log('Stored in session:', request.session.oauth);

      // Force save session before Passport redirect
      try {
        await new Promise<void>((resolve, reject) => {
          request.session.save((err: any) => {
            if (err) {
              console.error('Session save error:', err);
              reject(err);
            } else {
              console.log('Session saved successfully!');
              resolve();
            }
          });
        });
      } catch (error) {
        console.error('Failed to save session:', error);
        return false;
      }
    }

    // Now let Passport handle the redirect
    const result = await super.canActivate(context);
    console.log('=== GUARD COMPLETED, PASSPORT SHOULD REDIRECT ===');
    return result as boolean;
  }
}
