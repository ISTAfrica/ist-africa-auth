'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function LinkedInCallbackPage() {
  const searchParams = useSearchParams();

  useEffect(() => {
    // 1. Grab the tokens/data sent by the backend
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');
    const redirectUri = searchParams.get('redirect_uri');
    const error = searchParams.get('error');

    // 2. Send this data to the Main Window (opener)
    if (window.opener) {
      window.opener.postMessage({
        type: 'LINKEDIN_AUTH_SUCCESS',
        payload: {
          accessToken,
          refreshToken,
          redirect_uri: redirectUri,
          error
        }
      }, window.location.origin); // Ensure security by limiting to same origin
    }

    // 3. Close this popup window
    window.close();
  }, [searchParams]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background p-4 text-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
      <h3 className="text-lg font-semibold">Authenticating...</h3>
      <p className="text-muted-foreground text-sm">Please wait while we log you in.</p>
    </div>
  );
}