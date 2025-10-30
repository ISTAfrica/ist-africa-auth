import ResetPasswordForm from '@/components/auth/ResetPasswordForm';
import { Suspense } from 'react';

// This is the key part for Next.js to connect the URL to the page.
export default function ResetPasswordPage({ params }: { params: { token: string } }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-lg shadow-lg p-8 border">
          <Suspense fallback={<div className="text-center">Loading...</div>}>
            {/* The token from the URL is passed here */}
            <ResetPasswordForm token={params.token} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}