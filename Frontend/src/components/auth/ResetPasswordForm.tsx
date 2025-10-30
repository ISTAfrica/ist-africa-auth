'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { resetPassword } from '@/services/resetPasswordService'; // Assuming service is correctly named and located

// This is the key part: The component accepts a 'token' prop.
export default function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Token now comes from props, so this check is still valid.
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

  // This initial check for the token is good.
  if (!token) {
    return <div>Invalid Token...</div>; // Simple fallback
  }

  // The rest of your JSX remains the same
  return (
    <>
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-foreground mb-1">Reset Password</h2>
        <p className="text-muted-foreground">Enter your new password</p>
      </div>

      {success ? (
        <Alert className="border-green-500 bg-green-500/10 text-green-700">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Password reset successfully! Redirecting to login...
          </AlertDescription>
        </Alert>
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
            <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
          </div>

          <Button type="submit" className="w-full font-semibold" disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : 'Reset Password'}
          </Button>
        </form>
      )}
    </>
  );
}