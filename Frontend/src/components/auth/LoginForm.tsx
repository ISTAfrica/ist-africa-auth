'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, Loader2, Linkedin, ShieldCheck } from 'lucide-react';
import { loginWithLinkedIn } from '@/services/authService';
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
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const [clientInfo, setClientInfo] = useState<ClientInfo | null>(null);
  const [isOauthFlow, setIsOauthFlow] = useState(false);
  const [isLinkedInLoading, setIsLinkedInLoading] = useState(false);

  const clientIdFromUrl = searchParams.get('client_id');
  const redirectUriFromUrl = searchParams.get('redirect_uri');
  const stateFromUrl = searchParams.get('state');
  const isForgotPassword = searchParams.get('forgot') === 'true' || forgotPasswordInitial;

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

// Frontend/src/components/auth/LoginForm.tsx
const handleLinkedInLogin = async () => {
  try {
    // Store current path for redirect after login
    const redirectPath = window.location.pathname;
    localStorage.setItem('redirectAfterLogin', redirectPath);
    
    // Open login in a popup
    const width = 600;
    const height = 700;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    
    const popup = window.open(
      '',
      'linkedin-login',
      `toolbar=no, location=no, directories=no, status=no, menubar=no, 
      scrollbars=no, resizable=no, copyhistory=no, width=${width}, 
      height=${height}, top=${top}, left=${left}`
    );

    // Get the LinkedIn URL
    const response = await fetch('http://localhost:5000/api/auth/linkedin/url', {
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('Failed to get LinkedIn URL');
    }
    
    const { url } = await response.json();
    if (!popup || popup.closed || typeof popup.closed === 'undefined') {
  throw new Error('Popup was blocked. Please allow popups for this site and try again.');
}
    popup.location.href = url;

    // Listen for auth success message from popup
    const messageHandler = (event: MessageEvent) => {
      if (event.origin !== 'http://localhost:3000') return;
      
      if (event.data.type === 'LINKEDIN_AUTH_SUCCESS') {
        const { accessToken, refreshToken, user } = event.data;
        localStorage.setItem('accessToken', accessToken);
        if (refreshToken) {
          localStorage.setItem('refreshToken', refreshToken);
        }
        localStorage.setItem('user', JSON.stringify(user));
        
        // Update your app's auth state here
        // e.g., setUser(user);
        
        // Redirect to the intended page or home
        const redirectTo = localStorage.getItem('redirectAfterLogin') || '/dashboard';
        localStorage.removeItem('redirectAfterLogin');
        window.location.href = redirectTo;
      }
    };

    window.addEventListener('message', messageHandler);

    // Cleanup
    return () => {
      window.removeEventListener('message', messageHandler);
    };
  } catch (error) {
    console.error('Error initiating LinkedIn login:', error);
    setError('Failed to initiate LinkedIn login');
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



          <fieldset disabled={loading || (isOauthFlow && !clientInfo)} className="space-y-4">
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

          <Button type="submit" className="w-full font-semibold" disabled={loading || (isOauthFlow && !clientInfo)}>
            {loading ? <Loader2 className="animate-spin" /> : 'Sign In'}
          </Button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Or continue with</span></div>
          </div>

<Button
  type="button"
  variant="outline"
  className="w-full font-semibold bg-[#0A66C2] hover:bg-[#0A66C2]/90 text-white border-[#0A66C2]"
  onClick={handleLinkedInLogin}
  disabled={isLinkedInLoading || loading || (isOauthFlow && !clientInfo)}
>
  {isLinkedInLoading ? (
    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  ) : (
    <Linkedin className="mr-2 h-4 w-4" />
  )}
  Continue with LinkedIn
</Button>

          <p className="text-center text-sm text-muted-foreground pt-4">
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