
import ChangePasswordForm from '@/components/auth/ChangePasswordForm';
import { Suspense } from 'react';

export default function ChangePasswordPage() {
  return (
    <Suspense fallback={<div>Loading form...</div>}>
      <ChangePasswordForm />
    </Suspense>
  );
}