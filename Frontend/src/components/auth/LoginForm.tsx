'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, Loader2, Linkedin } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { authenticateUser, requestPasswordReset } from '@/services/authService';

interface LoginFormProps {
  forgotPasswordInitial: boolean;
}

export default function LoginForm({ forgotPasswordInitial }: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isForgotPassword = searchParams.get('forgot') === 'true' || forgotPasswordInitial;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await authenticateUser({ email, password });
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      router.push('/dashboard');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await requestPasswordReset(email);
      setResetSent(true);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const title = isForgotPassword ? 'Reset Password' : 'Welcome Back';
  const subtitle = isForgotPassword ? 'Enter your email to receive a password reset link' : 'Sign in to access your account';


  return (
    <>
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-foreground mb-1">{isForgotPassword ? 'IAA' : title}</h2>
        <p className="text-muted-foreground">{isForgotPassword ? subtitle : 'Sign in with your IAA credentials'}</p>
      </div>

      {isForgotPassword ? (
        resetSent ? (
          <div className="space-y-4">
            <Alert className="border-green-500 bg-green-500/10 text-green-700">
              <AlertDescription>
                Password reset link has been sent to your email address.
              </AlertDescription>
            </Alert>
            <Button
              onClick={() => router.push('/login')}
              variant="outline"
              className="w-full"
            >
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
              <Input
                id="reset-email" type="email" placeholder="you@example.com"
                value={email} onChange={(e) => setEmail(e.target.value)} required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : 'Send Reset Link'}
            </Button>
            <Button type="button" onClick={() => router.push('/login')} variant="ghost" className="w-full">
              Back to Login
            </Button>
          </form>
        )
      ) : (
        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>

          <div className="text-right">
            <button
              type="button"
              onClick={() => router.push('/login?forgot=true')}
              className="text-sm font-medium text-primary hover:underline focus:outline-none"
            >
              Forgot your password?
            </button>
          </div>

          <Button type="submit" className="w-full font-semibold" disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : 'Sign In'}
          </Button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full font-semibold bg-linkedin text-white hover:bg-linkedin/90 border-linkedin"
          >
            <Linkedin className="mr-2 h-4 w-4" />
            Continue with LinkedIn
          </Button>

          <p className="text-center text-xs text-muted-foreground pt-4">
            Secured by IST Africa Auth
          </p>
        </form>
      )}
    </>
  );
}