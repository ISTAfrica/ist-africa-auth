'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, Loader2, Linkedin, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { jwtDecode } from 'jwt-decode';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { authenticateUser } from '@/services/authService';
import { forgotPassword } from '@/services/resetPasswordService';
import { getClientPublicInfo } from '@/services/clientsService';

interface DecodedToken {
  sub: string;
  role: 'user' | 'admin';
  iat?: number;
  exp?: number;
}

interface ClientInfo {
  name: string;
  description?: string;
}

interface LoginFormProps {
  forgotPasswordInitial?: boolean;
}

export default function LoginForm({ forgotPasswordInitial = false }: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [linkedinLoading, setLinkedinLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const [clientInfo, setClientInfo] = useState<ClientInfo | null>(null);
  const [isOauthFlow, setIsOauthFlow] = useState(false);

  const clientIdFromUrl = searchParams.get('client_id');
  const redirectUriFromUrl = searchParams.get('redirect_uri');
  const stateFromUrl = searchParams.get('state');
  const isForgotPassword = searchParams.get('forgot') === 'true' || forgotPasswordInitial;

  // 1. Initial Checks (OAuth / Errors)
  useEffect(() => {
    const errorFromUrl = searchParams.get('error');
    if (errorFromUrl) {
      setError(decodeURIComponent(errorFromUrl));
    }
  }, [searchParams]);

  useEffect(() => {
    if (clientIdFromUrl) {
      setIsOauthFlow(true);
      setError('');
      const fetchClientInfo = async () => {
        try {
          const data = await getClientPublicInfo(clientIdFromUrl);
          setClientInfo(data);
        } catch (err) {
          setError('The application you are trying to log into is not registered or is invalid.');
        }
      };
      fetchClientInfo();
    }
  }, [clientIdFromUrl]);

  // =======================================================================
  //  THE ROBUST LISTENER: Handles redirect + Polling Fallback
  // =======================================================================
  useEffect(() => {
    
    // Helper: Perform the redirect if a token is found
    const performRedirect = (token: string) => {
      // 1. Stop spinners
      setLinkedinLoading(false);
      setLoading(false);

      try {
        const decoded = jwtDecode<DecodedToken>(token);
        
        // Ensure userId is saved
        if (decoded.sub && !localStorage.getItem('userId')) {
            localStorage.setItem('userId', decoded.sub);
        }

        // Redirect based on role
        if (decoded.role === 'admin') {
          router.push('/admin/clients');
        } else {
          router.push('/user/profile'); 
        }
      } catch (e) {
        // Fallback if decode fails but token exists
        router.push('/user/profile');
      }
    };

    // Listener 1: PostMessage (Direct signal from Popup)
    const handleAuthMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      
      if (event.data?.type === 'LINKEDIN_AUTH_SUCCESS') {
        const { accessToken, refreshToken, error: authError } = event.data.payload;
        if (authError) {
            setLinkedinLoading(false);
            setError(authError);
            return;
        }
        if (accessToken) {
            localStorage.setItem('accessToken', accessToken);
            if(refreshToken) localStorage.setItem('refreshToken', refreshToken);
            performRedirect(accessToken);
        }
      }
    };

    // Listener 2: Storage (If popup updates LS directly)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'accessToken' && e.newValue) {
        performRedirect(e.newValue);
      }
    };

    // Listener 3: POLLING (The Ultimate Fix for Stuck Spinners)
    // If the spinner is running, check LS every 500ms.
    let pollInterval: NodeJS.Timeout;
    if (linkedinLoading) {
        pollInterval = setInterval(() => {
            const token = localStorage.getItem('accessToken');
            if (token) {
                clearInterval(pollInterval);
                performRedirect(token);
            }
        }, 500);
    }

    // Register events
    window.addEventListener('message', handleAuthMessage);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('message', handleAuthMessage);
      window.removeEventListener('storage', handleStorageChange);
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [router, linkedinLoading]); 


  // --- Handlers ---

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const payload = {
      email,
      password,
      ...(isOauthFlow && { client_id: clientIdFromUrl, redirect_uri: redirectUriFromUrl, state: stateFromUrl}),
    };

    try {
      const data = await authenticateUser(payload);

      if (data.redirect_uri) {
        window.location.href = data.redirect_uri;
      } else if (data.accessToken) {
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);

        const decodedToken = jwtDecode<DecodedToken>(data.accessToken);
        if (decodedToken.sub) {
          localStorage.setItem('userId', decodedToken.sub);
        }

        if (decodedToken.role === 'admin') {
          router.push('/admin/clients');
        } else {
          router.push('/user/profile');
        }
      } else {
        throw new Error('Invalid response from authentication server.');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
      setLoading(false);
    }
  };

  const handleLinkedInLogin = () => {
    setLinkedinLoading(true);
    setError('');
    
    // Clear old tokens so we don't redirect on stale data
    localStorage.removeItem('accessToken'); 
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userId');

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    let linkedinUrl = `${baseUrl}/api/auth/linkedin`;
    
    if (isOauthFlow && clientIdFromUrl) {
      const params = new URLSearchParams({
        client_id: clientIdFromUrl,
        redirect_uri: redirectUriFromUrl || '',
        state: stateFromUrl || '',
      });
      linkedinUrl += `?${params.toString()}`;
    }
    
    // Center popup
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      linkedinUrl,
      'linkedin-login-popup',
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes`
    );

    if (popup) {
      popup.focus();
    } else {
      setLinkedinLoading(false);
      setError('Pop-up blocked. Please allow pop-ups for this site.');
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await forgotPassword({ email });
      setResetSent(true);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError('An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const title = isForgotPassword ? 'Reset Password' : 'Welcome Back';

  return (
    <>
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-foreground mb-1">{isOauthFlow ? 'Sign in to continue' : title}</h2>
        <p className="text-muted-foreground">{isOauthFlow ? 'Please log in to your IST Africa account.' : 'Sign in with your IAA credentials'}</p>
      </div>

      {isOauthFlow && (
        <div className="mb-6">
          {clientInfo ? (
            <div className="p-4 border rounded-lg bg-muted/50 text-center">
              <ShieldCheck className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">You are granting access to:</p>
              <p className="font-semibold text-foreground">{clientInfo.name}</p>
            </div>
          ) : (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error || 'Loading application info...'}</AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {isForgotPassword ? (
        resetSent ? (
          <div className="space-y-4">
            <Alert className="border-green-500 bg-green-500/10 text-green-700">
              <AlertDescription>Password reset link has been sent to your email address.</AlertDescription>
            </Alert>
            <Button onClick={() => router.push('/auth/login')} variant="outline" className="w-full">
              Back to Login
            </Button>
          </div>
        ) : (
          <form onSubmit={handlePasswordReset} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="reset-email">Email Address</Label>
              <Input id="reset-email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : 'Send Reset Link'}
            </Button>
            <Button type="button" onClick={() => router.push('/auth/login')} variant="ghost" className="w-full">
              Back to Login
            </Button>
          </form>
        )
      ) : (
        <form onSubmit={handleLogin} className="space-y-4">
          {!isOauthFlow && error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <fieldset disabled={loading || linkedinLoading || (isOauthFlow && !clientInfo)}>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
          </fieldset>

          <div className="text-right">
            <button type="button" onClick={() => router.push('/auth/login?forgot=true')} className="text-sm font-medium text-primary hover:underline focus:outline-none">
              Forgot your password?
            </button>
          </div>

          <Button type="submit" className="w-full font-semibold" disabled={loading || linkedinLoading || (isOauthFlow && !clientInfo)}>
            {loading ? <Loader2 className="animate-spin" /> : 'Sign In'}
          </Button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Or continue with</span></div>
          </div>

          <Button 
            type="button"
            onClick={handleLinkedInLogin}
            variant="outline" 
            className="w-full font-semibold bg-linkedin text-white hover:bg-linkedin/90 border-linkedin"
            disabled={loading || linkedinLoading || (isOauthFlow && !clientInfo)}
          >
            {linkedinLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <div className="flex items-center">
                <Linkedin className="mr-2 h-4 w-4" />
                Continue with LinkedIn
              </div>
            )}
          </Button>

          <p className="text-center text-sm text-muted-foreground pt-4">
            Don&apos;t have an account?{' '}
            <Link href="/auth/signup" className="font-medium text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </form>
      )}
    </>
  );
}