'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (window.opener && code) {
      window.opener.postMessage(
        {
          type: 'iaa-auth-callback',
          code: code,
          state: state,
        },
        '*' 
      );
      
      window.close();
    }
  }, [searchParams]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center bg-card p-4">
      <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
      <p className="text-muted-foreground">
        Finalizing authentication, please wait...
      </p>
      <p className="text-xs text-muted-foreground mt-2">
        This window will close automatically.
      </p>
    </div>
  );
}