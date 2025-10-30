import ResetPasswordForm from '@/components/auth/ResetPasswordForm';
import { Suspense } from 'react';

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-lg shadow-lg p-8 border">
          <Suspense fallback={<div className="text-center">Loading form...</div>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}