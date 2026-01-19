'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { verifyOtp, resendOtp } from '@/services/authService';
import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
  sub: string;
  role: 'user' | 'admin';
  iat?: number;
  exp?: number;
}

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const emailFromQuery = searchParams.get('email');
    const cachedEmail = localStorage.getItem('pendingEmail');
    if (emailFromQuery) {
      setEmail(emailFromQuery);
    } else if (cachedEmail) {
      setEmail(cachedEmail);
    } else {
      router.push('/auth/login');
    }
  }, [searchParams, router]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const { accessToken, refreshToken } = await verifyOtp({ email, otp });
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.removeItem('pendingEmail');

      // Store userId from token's 'sub' field (subject)
      const decodedToken = jwtDecode<DecodedToken>(accessToken);
      if (decodedToken.sub) {
        localStorage.setItem('userId', decodedToken.sub);
      }

      setSuccess('Verification successful! Redirecting to dashboard...');
      setTimeout(() => router.push('/user/profile '), 2000);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError('An unknown error occurred');
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setSuccess('');
    try {
      await resendOtp({ email });
      setSuccess('A new verification code has been sent.');
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError('Failed to resend code.');
    }
  };
  
  if (!email) {
    return null; 
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="max-w-sm w-full">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-1">Check Your Email</h2>
          <p className="text-muted-foreground">
            We&apos;ve sent a 6-digit code to <span className="font-semibold text-foreground">{email}</span>
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert className="border-green-500 bg-green-500/10 text-green-700 dark:text-green-500">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="otp">Verification Code</Label>
            <Input
              id="otp"
              type="text"
              inputMode="numeric"
              placeholder="123456"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/[^\d]/g, ''))}
              required
              maxLength={6}
              className="text-center text-lg tracking-[0.5em]"
            />
          </div>

          <Button type="submit" className="w-full font-semibold" disabled={loading}>
            {loading && !success ? <Loader2 className="animate-spin" /> : 'Verify Account'}
          </Button>

          <div className="text-center text-sm text-muted-foreground pt-2">
            Didn&apos;t receive a code?{' '}
            <button
              type="button"
              onClick={handleResend}
              className="font-medium text-primary hover:underline"
              disabled={loading}
            >
              Resend
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}