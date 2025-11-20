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
        bg-card 
        md:bg-slate-50 
        dark:md:bg-zinc-900 
        md:flex 
        md:flex-col 
        md:items-center 
        md:justify-center 
        md:p-6
      "
    >
      <div className="w-full max-w-md">
        <div className="hidden md:flex mb-8 justify-center">
          <Logo />
        </div>
        <div 
          className="
            p-8 
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
          © 2025 IST Africa. All rights reserved.
        </p>
      </div>
    </div>
  );
}