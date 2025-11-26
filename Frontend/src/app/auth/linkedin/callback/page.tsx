'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
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
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  // State to hold the final destination path for the success message
  const [redirectPath, setRedirectPath] = useState(''); 

  useEffect(() => {
    // 1. Replaced alert() with console.log()
    console.log('Callback page loaded! URL:', window.location.search);
    console.log('All params:', Object.fromEntries(searchParams.entries()));
    
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');
    console.log('accessToken:', accessToken ? 'Received' : 'Not received');
    console.log('refreshToken:', refreshToken ? 'Received' : 'Not received');
    const redirectUri = searchParams.get('redirect_uri');
    const error = searchParams.get('error');
    const message = searchParams.get('message');

    let finalRedirectPath = '';

    // 1. Handle Error (from backend redirect)
    if (error) {
      const authErrorMessage = message || 'LinkedIn authentication failed';
      setStatus('error');
      setErrorMessage(authErrorMessage);
      
      setTimeout(() => {
        router.push(`/auth/login?error=${encodeURIComponent(authErrorMessage)}`);
      }, 2000);
      return;
    }

    // 2. Handle OAuth2 flow redirect (External client redirect)
    if (redirectUri) {
      // Use window.location.href for immediate external redirect
      window.location.href = redirectUri;
      return;
    }

    // 3. Handle direct login flow (Token decoding and storage)
    if (accessToken && refreshToken) {
      try {
        // Store tokens
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);

        // Decode token to get user role (Original functionality preserved)
        const decodedToken = jwtDecode<DecodedToken>(accessToken);

        if (decodedToken.sub) {
          localStorage.setItem('userId', decodedToken.sub);
        }

        // Determine redirect path based on role (Original functionality preserved)
        if (decodedToken.role === 'admin') {
          finalRedirectPath = '/admin/clients';
        } else {
          finalRedirectPath = '/user/profile';
        }
        
        setStatus('success');
        setRedirectPath(finalRedirectPath);
        
        // Redirect after a short delay to display success message
        setTimeout(() => {
            router.push(finalRedirectPath);
        }, 1500);
        
      } catch (err) {
        // Handle decoding error
        setStatus('error');
        const authErrorMessage = 'Invalid token received or decoding failed';
        setErrorMessage(authErrorMessage);
        
        setTimeout(() => {
            router.push(`/auth/login?error=${encodeURIComponent(authErrorMessage)}`);
        }, 2000);
      }
      return;
    }
    
    // 4. Default Fallback (No tokens, no error)
    setStatus('error');
    const defaultError = 'No authentication data received';
    setErrorMessage(defaultError);
    
    setTimeout(() => {
        router.push(`/auth/login?error=${encodeURIComponent(defaultError)}`);
    }, 2000);
    
  }, [searchParams, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center p-8 bg-white shadow-lg rounded-lg max-w-sm w-full">
        
        {/* Loading Status */}
        {status === 'loading' && (
          <div className="text-blue-500">
            <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Authenticating with LinkedIn...</h2>
            <p className="text-gray-600">Please wait</p>
          </div>
        )}
        
        {/* Success Status */}
        {status === 'success' && (
          <div className="text-green-500">
            <CheckCircle2 className="w-10 h-10 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Authentication Successful!</h2>
            <p className="text-gray-600">Redirecting to {redirectPath}...</p>
          </div>
        )}
        
        {/* Error Status */}
        {status === 'error' && (
          <div className="text-red-500">
            <XCircle className="w-10 h-10 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Authentication Failed</h2>
            <p className="text-gray-600">{errorMessage}</p>
            <p className="text-gray-600 mt-2">Redirecting back to login...</p>
          </div>
        )}
      </div>
    </div>
  );
}