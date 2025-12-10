'use client';

import { Loader2 } from 'lucide-react';

export default function LinkedInCallback() {

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center p-8 bg-white shadow-lg rounded-lg max-w-md w-full">
        <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold mb-3">Authenticating...</h2>
        <p className="text-gray-600">Please wait while we complete your authentication</p>
      </div>
    </div>
  );
}
