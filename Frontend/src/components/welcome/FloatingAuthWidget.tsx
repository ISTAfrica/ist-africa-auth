'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LogIn } from 'lucide-react';

export const FloatingAuthWidget = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const pathname = usePathname(); 
  const router = useRouter();     

  useEffect(() => {
    const authStatus = localStorage.getItem('iaa_authenticated');
    setIsAuthenticated(authStatus === 'true');

    const handleAuthChange = () => {
      const status = localStorage.getItem('iaa_authenticated');
      setIsAuthenticated(status === 'true');
    };

    window.addEventListener('storage', handleAuthChange);
    // Custom event to trigger re-check, e.g., after login
    window.addEventListener('iaa-auth-change', handleAuthChange);

    return () => {
      window.removeEventListener('storage', handleAuthChange);
      window.removeEventListener('iaa-auth-change', handleAuthChange);
    };
  }, []);


  const hiddenPaths = [
    'auth/login',
    'auth/signup',
    '/dashboard',
    '/iaa-auth',
    '/reset-password',
  ];

  const hideWidget = isAuthenticated || hiddenPaths.includes(pathname);

  if (hideWidget) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Button
        onClick={() => router.push('/auth/login')}
        size="lg"
        className="shadow-lg hover:shadow-primary/30 transition-all duration-300 hover:scale-105"
      >
        <LogIn className="mr-2 h-5 w-5" />
        Login with IAA
      </Button>
    </div>
  );
};