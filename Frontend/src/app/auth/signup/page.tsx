import SignUpForm from '@/components/auth/SignUpForm';
import { Suspense } from 'react';

export default function SignUpPage() {
  return (
    <Suspense fallback={<div>Loading form...</div>}>
      <SignUpForm />
    </Suspense>
  );
}