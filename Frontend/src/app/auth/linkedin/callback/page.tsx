'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { XCircle } from 'lucide-react'; // Only need XCircle for error state
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
  
  // We only track 'error' state for rendering. Otherwise, we assume we are redirecting.
  const [isError, setIsError] = useState(false); 
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Console logs are useful for debugging this invisible process
    console.log('Callback page loaded! Initiating invisible background redirect.');
    
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');
    const redirectUri = searchParams.get('redirect_uri');
    const error = searchParams.get('error');
    const message = searchParams.get('message');

    let finalRedirectPath = '';

    // 1. Handle Backend Error
    if (error) {
      const authErrorMessage = message || 'LinkedIn authentication failed';
      setIsError(true);
      setErrorMessage(authErrorMessage);
      
      // Redirect to login with error after a short delay
      setTimeout(() => {
        router.replace(`/auth/login?error=${encodeURIComponent(authErrorMessage)}`);
      }, 2000);
      return;
    }

    // 2. Handle External Client Redirect (OAuth2 flow)
    if (redirectUri) {
      window.location.href = redirectUri;
      return;
    }

    // 3. Handle Successful Login (Token decoding and storage)
    if (accessToken && refreshToken) {
      try {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);

        const decodedToken = jwtDecode<DecodedToken>(accessToken);
        localStorage.setItem('userId', decodedToken.sub);

        // Determine redirect path based on role
        if (decodedToken.role === 'admin') {
          finalRedirectPath = '/admin/clients';
        } else {
          finalRedirectPath = '/user/profile';
        }
        
        // **INSTANT REDIRECT**: User is sent directly to the profile/dashboard.
        // We add a flag for the destination page to show a quick success notification.
        router.replace(`${finalRedirectPath}?loginSuccess=true`);
        
        return; // Stop execution to ensure instant navigation
        
      } catch (err) {
        // Handle decoding error
        setIsError(true);
        const authErrorMessage = 'Invalid token received or decoding failed';
        setErrorMessage(authErrorMessage);
        
        setTimeout(() => {
            router.replace(`/auth/login?error=${encodeURIComponent(authErrorMessage)}`);
        }, 2000);
        return;
      }
    }
    
    // 4. Default Fallback (No tokens, no error)
    if (!accessToken && !error && !redirectUri) {
        setIsError(true);
        const defaultError = 'No authentication data received';
        setErrorMessage(defaultError);
        
        setTimeout(() => {
            router.replace(`/auth/login?error=${encodeURIComponent(defaultError)}`);
        }, 2000);
    }
    
  }, [searchParams, router]);

  // --- JSX Rendering ---
  
  // **KEY CHANGE**: If not an error, render NOTHING (null). 
  // This eliminates the brief loading spinner and text.
  if (!isError) {
    return null; 
  }
  
  // If there's an error, show a message for 2 seconds before redirecting.
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center p-8 bg-white shadow-lg rounded-lg max-w-sm w-full">
        
        {/* Error Status */}
        <div className="text-red-500">
          <XCircle className="w-10 h-10 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Authentication Failed</h2>
          <p className="text-gray-600">{errorMessage}</p>
          <p className="text-gray-600 mt-2">Redirecting back to login...</p>
        </div>
      </div>
    </div>
  );
}