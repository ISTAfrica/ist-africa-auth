'use client';

import { use, Suspense } from 'react';
import ResetPasswordForm from '@/components/auth/ResetPasswordForm';

interface PageProps {
  params: Promise<{ token: string }>;
  searchParams?: Promise<{ token?: string }>;
}

export default function ResetPasswordPage({ params, searchParams }: PageProps) {
  const resolvedParams = use(params);
  const resolvedSearchParams = searchParams ? use(searchParams) : undefined;
  
  const token = resolvedParams.token || resolvedSearchParams?.token;

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-center text-red-600">Invalid or missing token.</p>
      </div>
    );
  }

  return (
    // <div className="w-full max-w-md flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">Reset Password</h1>
        <Suspense fallback={<div className="text-center">Loading...</div>}>
          <ResetPasswordForm token={token} />
        </Suspense>
      </div>
    // </div>
  );
}





