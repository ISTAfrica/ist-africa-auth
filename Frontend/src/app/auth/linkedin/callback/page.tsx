'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
  sub: string;
  role: 'user' | 'admin';
  iat?: number;
  exp?: number;
}

export default function LinkedInCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
   
    

  useEffect(() => {
    alert('Callback page loaded! URL: ' + window.location.search);
     // Add this at the top to debug
     console.log('All params:', Object.fromEntries(searchParams.entries()));
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');
    console.log('accessToken:', accessToken);
    console.log('refreshToken:', refreshToken);
    const redirectUri = searchParams.get('redirect_uri');
    const error = searchParams.get('error');
    const message = searchParams.get('message');

    if (error) {
      const errorMessage = message || 'LinkedIn authentication failed';
      router.push(`/auth/login?error=${encodeURIComponent(errorMessage)}`);
      return;
    }

    // Handle OAuth2 flow redirect
    if (redirectUri) {
      window.location.href = redirectUri;
      return;
    }

    // Handle direct login flow
    if (accessToken && refreshToken) {
      try {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);

        const decodedToken = jwtDecode<DecodedToken>(accessToken);
        if (decodedToken.sub) {
          localStorage.setItem('userId', decodedToken.sub);
        }

        if (decodedToken.role === 'admin') {
          router.push('/admin/clients');
        } else {
          router.push('/dashboard');
        }
      } catch (err) {
        router.push('/auth/login?error=Invalid token received');
      }
      return;
    }

    router.push('/auth/login?error=No authentication data received');
  }, [searchParams, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <p className="text-muted-foreground">Authenticating with LinkedIn...</p>
      </div>
    </div>
  );
}