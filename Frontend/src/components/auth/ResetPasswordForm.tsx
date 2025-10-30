'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, Loader2, CheckCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { resetPassword } from '@/services/resetPasswordService';

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!token) {
      setError('Invalid or missing reset token');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);

    try {
      await resetPassword({
        token,
        newPassword,
      });
      setSuccess(true);
      setNewPassword('');
      setConfirmPassword('');
      
      setTimeout(() => {
        router.push('/auth/login');
      }, 2000);
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

  if (!token) {
    return (
      <div className="space-y-4">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-1">Invalid Link</h2>
          <p className="text-muted-foreground">This password reset link is invalid</p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Invalid or missing reset token. Please request a new password reset link.
          </AlertDescription>
        </Alert>
        <Button
          onClick={() => router.push('/auth/forgot-password')}
          className="w-full"
        >
          Request New Link
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-foreground mb-1">Reset Password</h2>
        <p className="text-muted-foreground">Enter your new password</p>
      </div>

      {success ? (
        <div className="space-y-4">
          <Alert className="border-green-500 bg-green-500/10 text-green-700">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Password reset successfully! Redirecting to login...
            </AlertDescription>
          </Alert>
        </div>
      ) : (
        <form onSubmit={handleResetPassword} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <Input
              id="new-password"
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              disabled={loading}
              minLength={8}
            />
            <p className="text-xs text-muted-foreground">
              Must be at least 8 characters long
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <Input
              id="confirm-password"
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
              minLength={8}
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
                Resetting Password...
              </>
            ) : (
              'Reset Password'
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