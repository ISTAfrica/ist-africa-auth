'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function LinkedInPopupHandler() {
  const searchParams = useSearchParams();

  useEffect(() => {
    // Only run if we are in a popup
    if (typeof window !== 'undefined' && window.opener && window.opener !== window) {
      
      const accessToken = searchParams.get('accessToken');
      const refreshToken = searchParams.get('refreshToken');
      const error = searchParams.get('error');

      // Send the data to the main window
      window.opener.postMessage({
        type: 'LINKEDIN_AUTH_SUCCESS', 
        payload: {
          accessToken,
          refreshToken,
          error
        }
      }, window.location.origin);

      // Close the popup
      window.close();
    }
  }, [searchParams]);

  return (
    <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-white">
      <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
      <p className="text-lg font-medium text-gray-600">Authenticating...</p>
    </div>
  );
}