'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Loader2, CheckCircle, Mail } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Inline API call for debugging
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

async function forgotPasswordDirect(email: string) {
  console.log('🌐 API_BASE_URL:', API_BASE_URL);
  console.log('🔥 Making fetch request to:', `${API_BASE_URL}/auth/forgot-password`);
  
  const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });

  console.log('📡 Response status:', response.status);
  console.log('📡 Response ok:', response.ok);

  const result = await response.json();
  console.log('📦 Response data:', result);

  if (!response.ok) {
    throw new Error(result.message || 'Failed to send reset email');
  }

  return result;
}

export default function ForgotPasswordForm() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    console.log('🚀 Form submitted!');

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);

    try {
      console.log('🔥 Calling forgotPassword API with email:', email);
      const result = await forgotPasswordDirect(email);
      console.log('✅ API Response:', result);
      setSuccess(true);
      setEmail('');
    } catch (err: unknown) {
      console.error('❌ API Error:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="mb-6 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
          <Mail className="h-6 w-6 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-1">Forgot Password?</h2>
        <p className="text-muted-foreground">
          Enter your email and we will send you a reset link
        </p>
      </div>

      {success ? (
        <div className="space-y-4">
          <Alert className="border-green-500 bg-green-500/10 text-green-700">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Password reset link sent! Check your email inbox.
            </AlertDescription>
          </Alert>
          <Button
            onClick={() => router.push('/auth/login')}
            variant="outline"
            className="w-full"
          >
            Back to Login
          </Button>
        </div>
      ) : (
        <form onSubmit={handleForgotPassword} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <Button
            type="submit"
            className="w-full font-semibold"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending Link...
              </>
            ) : (
              'Send Reset Link'
            )}
          </Button>

          <Button
            type="button"
            onClick={() => router.push('/auth/login')}
            variant="ghost"
            className="w-full"
            disabled={loading}
          >
            Back to Login
          </Button>

          <p className="text-center text-xs text-muted-foreground pt-4">
            Secured by IST Africa Auth
          </p>
        </form>
      )}
    </>
  );
}