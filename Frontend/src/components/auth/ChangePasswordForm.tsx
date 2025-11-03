'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Loader2, CheckCircle, Eye, EyeOff } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { changePassword } from '@/services/changePasswordService';


export default function ChangePasswordForm() {
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Eye toggle states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long');
      return;
    }

    if (newPassword === currentPassword) {
      setError('New password must be different from current password');
      return;
    }

    setLoading(true);

    try {
      await changePassword({
        currentPassword,
        newPassword,
        confirmPassword
      });
      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      setTimeout(() => {
        router.push('/dashboard');
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

  const renderPasswordInput = (
    id: string,
    label: string,
    value: string,
    setValue: React.Dispatch<React.SetStateAction<string>>,
    showPassword: boolean,
    toggleShowPassword: () => void
  ) => (
    <div className="space-y-2 relative">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={showPassword ? 'text' : 'password'}
        placeholder={label}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        required
        disabled={loading}
        className="pr-10"
      />
      <span
        className="absolute right-3 top-[38px] cursor-pointer"
        onClick={toggleShowPassword}
      >
        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </span>
    </div>
  );

  return (
    <>
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-foreground mb-1">Change Password</h2>
        <p className="text-muted-foreground">Update your account password</p>
      </div>

      {success ? (
        <div className="space-y-4">
          <Alert className="border-green-500 bg-green-500/10 text-green-700">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Password changed successfully! Redirecting...
            </AlertDescription>
          </Alert>
        </div>
      ) : (
        <form onSubmit={handleChangePassword} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {renderPasswordInput(
            'current-password',
            'Current Password',
            currentPassword,
            setCurrentPassword,
            showCurrentPassword,
            () => setShowCurrentPassword((prev) => !prev)
          )}

          {renderPasswordInput(
            'new-password',
            'New Password',
            newPassword,
            setNewPassword,
            showNewPassword,
            () => setShowNewPassword((prev) => !prev)
          )}
          <p className="text-xs text-muted-foreground">
            Must be at least 8 characters long
          </p>

          {renderPasswordInput(
            'confirm-password',
            'Confirm New Password',
            confirmPassword,
            setConfirmPassword,
            showConfirmPassword,
            () => setShowConfirmPassword((prev) => !prev)
          )}

          <Button
            type="submit"
            className="w-full font-semibold"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Changing Password...
              </>
            ) : (
              'Change Password'
            )}
          </Button>

          <Button
            type="button"
            onClick={() => router.back()}
            variant="ghost"
            className="w-full"
            disabled={loading}
          >
            Cancel
          </Button>

          <p className="text-center text-xs text-muted-foreground pt-4">
            Secured by IST Africa Auth
          </p>
        </form>
      )}
    </>
  );
}
