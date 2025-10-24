import LoginForm from '@/components/auth/LoginForm';
import { Suspense } from 'react';

type LoginPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = await searchParams;
  const isForgotPassword = resolvedSearchParams?.forgot === 'true';

  return (
    <Suspense fallback={<div>Loading form...</div>}>
      <LoginForm forgotPasswordInitial={isForgotPassword} />
    </Suspense>
  );
}