import React from 'react';

interface TestData {
  message: string;
  timestamp: string;
}

async function getTestData(): Promise<TestData> {

  const apiBaseUrl = process.env.VERCEL_URL 
    ? `https://${process.env.VERCEL_URL}` 
    : 'http://localhost:3000';

  const response = await fetch(`${apiBaseUrl}/api/test`, {
    cache: 'no-store', 
  });

  if (!response.ok) {
    throw new Error('Failed to fetch data from the API.');
  }

  return response.json();
}

export default async function TestPage() {
  const data = await getTestData();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-50">
      <div className="w-full max-w-2xl p-8 bg-white rounded-xl shadow-lg border border-gray-200">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          IST Africa Auth - Test Page
        </h1>
        <p className="text-lg text-gray-600 mb-6">
          This page retrieves data from a backend API endpoint.
        </p>

        <div className="p-6 bg-gray-100 border border-gray-300 rounded-md">
          <p className="text-sm font-semibold text-gray-500 mb-2">API Response:</p>
          <code className="text-md text-gray-900 whitespace-pre-wrap">
            {JSON.stringify(data, null, 2)}
          </code>
        </div>
      </div>
    </main>
  );
}