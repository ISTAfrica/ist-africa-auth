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
    <div className="flex flex-col items-center justify-center h-screen text-center bg-card px-1 py-1">
      <Loader2 className="h-5 w-5 animate-spin mb-1 text-primary" />
      <p className="text-xs text-muted-foreground leading-snug">
        Finalizing authentication, please wait...
      </p>
      <p className="text-[10px] text-muted-foreground mt-1 leading-snug">
        This window will close automatically.
      </p>
    </div>
  );
}