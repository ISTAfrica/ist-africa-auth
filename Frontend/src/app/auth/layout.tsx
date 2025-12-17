'use client';

import { ReactNode } from 'react';
import Logo from '@/components/auth/Logo';

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div 
      className="
        min-h-screen
        flex
        flex-col
        items-center
        justify-center
        bg-card 
        md:bg-slate-50 
        dark:md:bg-zinc-900 
        px-4
        py-6
        md:p-6
      "
    >
      <div className="w-full max-w-md">
        <div className="hidden md:flex mb-6 justify-center">
          <Logo />
        </div>
        <div 
          className="
            p-6 
            md:bg-card 
            md:rounded-2xl 
            md:shadow-lg 
            md:border 
            md:border-border
          "
        >
          {children}
        </div>
        <p className="hidden md:block text-center text-sm text-muted-foreground mt-6">
          2025 IST Africa. All rights reserved.
        </p>
      </div>
    </div>
  );
}