import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import VerifyOtpForm from '@/components/auth/VerifyOtpForm';

type VerifyEmailPageProps = {
  searchParams: { [key: string]: string | string[] | undefined };
};

export default function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const email = searchParams?.email;

  if (typeof email !== 'string') {

    redirect('auth/signup');
  }

  return (
    <Suspense fallback={<div>Loading form...</div>}>
      <VerifyOtpForm email={email} />
    </Suspense>
  );
}