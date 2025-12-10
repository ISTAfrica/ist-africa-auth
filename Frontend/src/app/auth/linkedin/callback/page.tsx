// Frontend/src/app/auth/callback/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CallbackPage() {
  const router = useRouter();

  useEffect(() => {
    // This is just a fallback in case the popup was closed
    // The main logic happens in the LoginForm component
    router.push('/');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Completing Login...</h1>
        <p>Please wait while we log you in.</p>
        <p className="mt-2 text-sm text-gray-500">
          If you're not redirected automatically, <a href="/" className="text-blue-500">click here</a>.
        </p>
      </div>
    </div>
  );
}