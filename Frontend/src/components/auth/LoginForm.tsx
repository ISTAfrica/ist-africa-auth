'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, Loader2, Linkedin, ShieldCheck, Info } from 'lucide-react';
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
  const [isClientInfoLoading, setIsClientInfoLoading] = useState(true);

  const clientIdFromUrl = searchParams.get('client_id');
  const redirectUriFromUrl = searchParams.get('redirect_uri');
  const stateFromUrl = searchParams.get('state');
  const isForgotPassword = searchParams.get('forgot') === 'true' || forgotPasswordInitial;

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
      setIsClientInfoLoading(true);
      const fetchClientInfo = async () => {
        try {
          const data = await getClientPublicInfo(clientIdFromUrl);
          setClientInfo(data);
        } catch (err) {
          setError('The application you are trying to log into is not registered or is invalid.');
        } finally {
          setIsClientInfoLoading(false);
        }
      };
      fetchClientInfo();
    } else {
      setIsClientInfoLoading(false);
    }
  }, [clientIdFromUrl]);

  // =======================================================================
  //  THE ROBUST LISTENER: Merged from your working version
  // =======================================================================
  useEffect(() => {
    const performRedirect = (token: string) => {
      setLinkedinLoading(false);
      setLoading(false);
      try {
        const decoded = jwtDecode<DecodedToken>(token);
        if (decoded.sub && !localStorage.getItem('userId')) {
          localStorage.setItem('userId', decoded.sub);
        }
        router.push(decoded.role === 'admin' ? '/admin/clients' : '/user/profile');
      } catch (e) {
        router.push('/user/profile');
      }
    };

    // --- THIS WAS THE MISSING PIECE ---
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
          if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
          performRedirect(accessToken);
        }
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'accessToken' && e.newValue) {
        performRedirect(e.newValue);
      }
    };

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

    window.addEventListener('message', handleAuthMessage);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('message', handleAuthMessage);
      window.removeEventListener('storage', handleStorageChange);
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [router, linkedinLoading]);

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

      // --- THIS IS THE UPDATED LOGIC ---
      if (data.redirect_uri) {
        // OAuth2 Flow: The backend returned the full URL for our messenger page.
        // Redirect the popup to that URL.
        window.location.href = data.redirect_uri;

      } else if (data.accessToken) {
        // Direct Login Flow: The backend returned tokens.
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);

        const decodedToken = jwtDecode<DecodedToken>(data.accessToken);
        if (decodedToken.sub) {
          localStorage.setItem('userId', decodedToken.sub);
        }

        if (decodedToken.role === 'admin') {
          router.push('/admin/clients');
        } else {
          router.push('/user');
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
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userId');
  
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    let linkedinUrl = `${baseUrl}/api/auth/linkedin`;
    
    // ADD THESE DEBUG LOGS
    console.log('isOauthFlow:', isOauthFlow);
    console.log('clientIdFromUrl:', clientIdFromUrl);
    console.log('redirectUriFromUrl:', redirectUriFromUrl);
    console.log('stateFromUrl:', stateFromUrl);
    
    if (isOauthFlow && clientIdFromUrl) {
      const params = new URLSearchParams({ 
        client_id: clientIdFromUrl, 
        redirect_uri: redirectUriFromUrl || '', 
        state: stateFromUrl || '' 
      });
      linkedinUrl += `?${params.toString()}`;
    }
    
    console.log('Final LinkedIn URL:', linkedinUrl); // CHECK THIS
    
    const width = 500, height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    const popup = window.open(linkedinUrl, 'linkedin-login-popup', `width=${width},height=${height},left=${left},top=${top},scrollbars=yes`);
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
  const subtitle = isForgotPassword ? 'Enter your email to receive a password reset link' : 'Sign in to access your account';

  return (
    <>
      <div className={isOauthFlow ? 'mb-2 text-center' : 'mb-4 text-center'}>
        <h2 className={isOauthFlow ? 'text-sm font-bold text-foreground mb-1' : 'text-xl font-bold text-foreground mb-1'}>
          {isOauthFlow ? 'Sign in to continue' : title}
        </h2>
        <p className={isOauthFlow ? 'text-xs text-muted-foreground leading-snug' : 'text-sm text-muted-foreground'}>
          {isOauthFlow ? 'Please log in to your IST Africa account.' : subtitle}
        </p>
      </div>

      {isOauthFlow && (
        <div className="mb-2">
          {isClientInfoLoading ? (
            <Alert variant="default" className="text-center">
              <Info className="h-4 w-4" />
              <AlertDescription>Loading application info...</AlertDescription>
            </Alert>
          ) : clientInfo ? (
            <div className="px-3 py-2 border rounded-lg bg-muted/50 text-center">
              <ShieldCheck className="h-6 w-6 text-primary mx-auto mb-1" />
              <p className="text-xs text-muted-foreground leading-snug">You are granting access to:</p>
              <p className="mt-0.5 text-sm font-semibold text-foreground truncate max-w-[240px] mx-auto">{clientInfo.name}</p>
            </div>
          ) : (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {isForgotPassword ? (
        resetSent ? (
          <div className="space-y-3">
            <Alert className="border-green-500 bg-green-500/10 text-green-700">
              <AlertDescription>Password reset link has been sent to your email address.</AlertDescription>
            </Alert>
            <Button onClick={() => router.push('/auth/login')} variant="outline" className="w-full">
              Back to Login
            </Button>
          </div>
        ) : (
          <form onSubmit={handlePasswordReset} className={isOauthFlow ? 'space-y-2' : 'space-y-3'}>
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className={isOauthFlow ? 'space-y-1.5' : 'space-y-2'}>
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
        <form onSubmit={handleLogin} className={isOauthFlow ? 'space-y-1.5' : 'space-y-3'}>
          {(isOauthFlow && error && !isClientInfoLoading) && (
            <Alert variant="destructive" className="my-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {!isOauthFlow && error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <fieldset disabled={loading || linkedinLoading || (isOauthFlow && isClientInfoLoading)}>
            <div className={isOauthFlow ? 'space-y-1.5' : 'space-y-2'}>
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
          </fieldset>

          <div className={isOauthFlow ? 'text-right mt-0.5' : 'text-right mt-1'}>
            <button
              type="button"
              onClick={() => router.push('/auth/login?forgot=true')}
              className={isOauthFlow ? 'text-xs font-medium text-primary hover:underline focus:outline-none' : 'text-sm font-medium text-primary hover:underline focus:outline-none'}
            >
              Forgot your password?
            </button>
          </div>

          <Button
            type="submit"
            className="w-full font-semibold"
            size={isOauthFlow ? 'sm' : 'default'}
            disabled={loading || linkedinLoading || (isOauthFlow && isClientInfoLoading)}
          >
            {loading ? <Loader2 className="animate-spin" /> : 'Sign In'}
          </Button>

          <div className={isOauthFlow ? "relative my-2" : "relative my-4"}>
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className={`relative flex justify-center uppercase ${isOauthFlow ? 'text-[10px]' : 'text-xs'}`}><span className="bg-card px-2 text-muted-foreground">Or continue with</span></div>
          </div>
          
          <Button 
            type="button"
            onClick={handleLinkedInLogin}
            variant="outline" 
            size={isOauthFlow ? 'sm' : 'default'}
            className="w-full font-semibold bg-linkedin text-white hover:bg-linkedin/90 border-linkedin"
            disabled={loading || linkedinLoading || (isOauthFlow && isClientInfoLoading)}
          >
            {linkedinLoading ? (
              <Loader2 className={`mr-2 animate-spin ${isOauthFlow ? 'h-3 w-3' : 'h-4 w-4'}`} />
            ) : (
              <Linkedin className={`mr-2 ${isOauthFlow ? 'h-3 w-3' : 'h-4 w-4'}`} />
            )}
            Continue with LinkedIn
          </Button>

          <p className={isOauthFlow ? 'text-center text-xs text-muted-foreground pt-1 leading-snug' : 'text-center text-sm text-muted-foreground pt-2'}>
            Don’t have an account?{' '}
            <Link href="/auth/signup" className="font-medium text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </form>
      )}
    </>
  );

}