'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function LinkedInCallbackPage() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');
    const redirect_uri = searchParams.get('redirect_uri');
    const error = searchParams.get('error');
    const userId = searchParams.get('userId');
    const name = searchParams.get('name');
    const email = searchParams.get('email');
    const role = searchParams.get('role');
    const membershipStatus = searchParams.get('membershipStatus');
    const profilePicture = searchParams.get('profilePicture');
    const isVerified = searchParams.get('isVerified');
    const isPopup = window.opener && window.opener !== window;

    if (isPopup) {
      
      try {
        const targetOrigin = '*';
        if (redirect_uri) {      
          try {
            const url = new URL(redirect_uri);
            const code = url.searchParams.get('code');
            const state = url.searchParams.get('state');
            
            if (code && state) {
              window.opener.postMessage(
                {
                  type: 'iaa-auth-callback',
                  code,
                  state
                },
                targetOrigin
              );
              
            } else {
              console.error('No code or state in redirect_uri');
            }
          } catch (urlError) {
            console.error('Failed to parse redirect_uri:', urlError);
          }
        } else {       
          window.opener.postMessage(
            {
              type: 'LINKEDIN_AUTH_SUCCESS',
              payload: {
                accessToken,
                refreshToken,
                error,
                userId,
                name,
                email,
                role,
                membershipStatus,
                profilePicture,
                isVerified
              }
            },
            targetOrigin
          );
        }
        setTimeout(() => {
          console.log('🔒 Closing popup');
          window.close();
        }, 100);
      } catch (err) {
        setTimeout(() => window.close(), 100);
      }
    } else {

      if (error) {
        window.location.href = `/auth/login?error=${error}`;
        return;
      }

      if (redirect_uri) {
        window.location.href = redirect_uri;
        return;
      }

      if (accessToken && refreshToken) {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        if (userId) localStorage.setItem('userId', userId);
        
        const redirectPath = role === 'admin' ? '/admin/clients' : '/user/profile';
        window.location.href = redirectPath;
      } else {
        window.location.href = '/auth/login?error=invalid_callback_response';
      }
    }
  }, [searchParams]);

  // return (
  //   <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
  //     <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
  //     <h3 className="text-lg font- text-foreground">Completing authentication...</h3>
  //     <p className="text-sm text-muted-foreground mt-2">Please wait while we log you in.</p>
  //   </div>
  // );
}