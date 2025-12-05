'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function LinkedinSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');

    if (accessToken && refreshToken) {
      // Save tokens (localStorage, context, etc.)
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      // Redirect user to dashboard
      router.replace('/dashboard');
    }
  }, [searchParams, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center bg-card p-4">
      <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
      <p className="text-muted-foreground">
        Logging in with LinkedIn, please wait...
      </p>
    </div>
  );
}
