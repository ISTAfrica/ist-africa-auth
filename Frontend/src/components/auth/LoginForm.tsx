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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const payload = {
      email,
      password,
      ...(isOauthFlow && { client_id: clientIdFromUrl, redirect_uri: redirectUriFromUrl, state: stateFromUrl }),
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
        router.push(decodedToken.role === 'admin' ? '/admin/clients' : '/user');
      } else {
        throw new Error('Invalid response from authentication server.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'An unknown error occurred');
    } finally {
      setLoading(false);
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
          {isOauthFlow ? 'Please log in to your IST Africa account.' : 'Sign in with your IAA credentials'}
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
          {isOauthFlow && error && !isClientInfoLoading && (
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

          <fieldset disabled={loading || (isOauthFlow && isClientInfoLoading)}>
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
            disabled={loading || (isOauthFlow && isClientInfoLoading)}
          >
            {loading ? <Loader2 className="animate-spin" /> : 'Sign In'}
          </Button>

          {isOauthFlow ? (
            <>
              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                <div className="relative flex justify-center text-[10px] uppercase"><span className="bg-card px-2 text-muted-foreground">Or continue with</span></div>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full text-xs font-semibold bg-linkedin text-white hover:bg-linkedin/90 border-linkedin"
              >
                <Linkedin className="mr-2 h-3 w-3" />
                Continue with LinkedIn
              </Button>

              <p className="text-center text-xs text-muted-foreground pt-1 leading-snug">
                Don’t have an account?{' '}
                <Link href="/auth/signup" className="font-medium text-primary hover:underline">
                  Sign up
                </Link>
              </p>
            </>
          ) : (
            <>
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Or continue with</span></div>
              </div>

              <Button type="button" variant="outline" className="w-full font-semibold bg-linkedin text-white hover:bg-linkedin/90 border-linkedin">
                <Linkedin className="mr-2 h-4 w-4" />
                Continue with LinkedIn
              </Button>

              <p className="text-center text-sm text-muted-foreground pt-2">
                Don’t have an account?{' '}
                <Link href="/auth/signup" className="font-medium text-primary hover:underline">
                  Sign up
                </Link>
              </p>
            </>
          )}
        </form>
      )}
    </>
  );
}