'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { XCircle } from 'lucide-react';
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
  
  const [isError, setIsError] = useState(false); 
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const processCallback = () => {
      const accessToken = searchParams.get('accessToken');
      const refreshToken = searchParams.get('refreshToken');
      const redirectUri = searchParams.get('redirect_uri');
      const error = searchParams.get('error');
      const message = searchParams.get('message');

      if (error) {
        const authErrorMessage = message || 'LinkedIn authentication failed';
        setIsError(true);
        setErrorMessage(authErrorMessage);
        
        setTimeout(() => {
          window.location.href = `/auth/login?error=${encodeURIComponent(authErrorMessage)}`;
        }, 500);
        return;
      }
      if (redirectUri) {
        window.location.href = redirectUri;
        return;
      }
      if (accessToken && refreshToken) {
        try {
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);

          const decodedToken = jwtDecode<DecodedToken>(accessToken);
          localStorage.setItem('userId', decodedToken.sub);

          const finalRedirectPath = decodedToken.role === 'admin' 
            ? '/admin/clients' 
            : '/user/profile';
          
          window.location.href = `${finalRedirectPath}?loginSuccess=true`;
          
        } catch (err) {
          setIsError(true);
          setErrorMessage('Invalid token received');
          
          setTimeout(() => {
            window.location.href = `/auth/login?error=${encodeURIComponent('Invalid token')}`;
          }, 500);
        }
        return;
      }
      setIsError(true);
      setErrorMessage('No authentication data received');
      
      setTimeout(() => {
        window.location.href = `/auth/login?error=${encodeURIComponent('No authentication data')}`;
      }, 500);
    };

    processCallback();
  }, [searchParams]);

  if (isError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center p-8 bg-white shadow-lg rounded-lg max-w-sm w-full">
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
  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      width: '100vw', 
      height: '100vh', 
      backgroundColor: 'white',
      zIndex: 9999 
    }} />
  );
}