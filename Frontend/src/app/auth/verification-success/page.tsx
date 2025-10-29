"use client";

import { useEffect } from 'react';

export default function VerificationSuccessPage() {
  useEffect(() => {
    const url = new URL(window.location.href);
    const accessToken = url.searchParams.get('accessToken');
    const refreshToken = url.searchParams.get('refreshToken');
    if (accessToken && refreshToken) {
      try {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
      } catch {}
      const appBase = process.env.NEXT_PUBLIC_APP_BASE_URL?.replace(/\/$/, '') || '';
      window.location.replace(`${appBase}/dashboard` || '/dashboard');
    }
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-background to-muted">
      <div className="max-w-sm w-full text-center space-y-4 rounded-lg border bg-card p-6 shadow-sm">
        <div className="mx-auto h-10 w-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-lg">
          ✓
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Email verified</h1>
          <p className="text-sm text-muted-foreground mt-1">
            You are being redirected...
          </p>
        </div>
      </div>
    </main>
  );
}


