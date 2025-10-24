import { ReactNode } from 'react';
import Logo from '@/components/auth/Logo';

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="bg-card rounded-2xl shadow-lg p-8 border border-border">
          {children}
        </div>
        <p className="text-center text-sm text-muted-foreground mt-6">
          © 2025 IST Africa. All rights reserved.
        </p>
      </div>
    </div>
  );
}