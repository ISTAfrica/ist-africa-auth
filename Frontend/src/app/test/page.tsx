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
    <main className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 p-8" style={{background: 'linear-gradient(135deg, #a855f7, #ec4899, #ef4444)', minHeight: '100vh', padding: '2rem'}}>
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-8" style={{textAlign: 'center', marginBottom: '2rem'}}>
          <h1 className="text-6xl font-black text-white mb-4 drop-shadow-lg" style={{fontSize: '3.75rem', fontWeight: '900', color: 'white', marginBottom: '1rem', textShadow: '2px 2px 4px rgba(0,0,0,0.5)'}}>
            🎨 Tailwind CSS
          </h1>
          <p className="text-2xl text-yellow-200 font-semibold" style={{fontSize: '1.5rem', color: '#fef08a', fontWeight: '600'}}>
            IST Africa Auth - Test Page
          </p>
        </div>

        {/* Colorful Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8" style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem'}}>
          <div className="bg-blue-500 p-6 rounded-2xl shadow-xl transform hover:scale-105 transition-transform" style={{backgroundColor: '#3b82f6', padding: '1.5rem', borderRadius: '1rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', transform: 'scale(1)', transition: 'transform 0.2s'}}>
            <h3 className="text-white text-xl font-bold mb-2" style={{color: 'white', fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem'}}>🔵 Blue Card</h3>
            <p className="text-blue-100" style={{color: '#dbeafe'}}>This card uses Tailwind's blue color palette!</p>
          </div>
          
          <div className="bg-green-500 p-6 rounded-2xl shadow-xl transform hover:scale-105 transition-transform" style={{backgroundColor: '#10b981', padding: '1.5rem', borderRadius: '1rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', transform: 'scale(1)', transition: 'transform 0.2s'}}>
            <h3 className="text-white text-xl font-bold mb-2" style={{color: 'white', fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem'}}>🟢 Green Card</h3>
            <p className="text-green-100" style={{color: '#dcfce7'}}>Hover effects and rounded corners!</p>
          </div>
          
          <div className="bg-orange-500 p-6 rounded-2xl shadow-xl transform hover:scale-105 transition-transform" style={{backgroundColor: '#f97316', padding: '1.5rem', borderRadius: '1rem', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', transform: 'scale(1)', transition: 'transform 0.2s'}}>
            <h3 className="text-white text-xl font-bold mb-2" style={{color: 'white', fontSize: '1.25rem', fontWeight: '700', marginBottom: '0.5rem'}}>🟠 Orange Card</h3>
            <p className="text-orange-100" style={{color: '#fed7aa'}}>Responsive grid layout!</p>
          </div>
        </div>

        {/* API Response Section */}
        <div className="bg-white/90 backdrop-blur-sm p-8 rounded-3xl shadow-2xl border-4 border-yellow-300">
          <div className="flex items-center mb-4">
            <span className="text-4xl mr-3">🚀</span>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              API Response
            </h2>
          </div>
          
          <p className="text-lg text-gray-700 mb-6">
            This page retrieves data from a backend API endpoint with beautiful styling!
          </p>

          <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-6 rounded-xl border-2 border-purple-300">
            <p className="text-sm font-semibold text-purple-300 mb-3 flex items-center">
              <span className="mr-2">📡</span>
              Live API Data:
            </p>
            <code className="text-green-400 text-sm whitespace-pre-wrap font-mono">
              {JSON.stringify(data, null, 2)}
            </code>
          </div>
        </div>

        {/* Fun Elements */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center space-x-4 bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full">
            <span className="text-2xl animate-bounce">🎉</span>
            <span className="text-white font-bold text-lg">Tailwind CSS is Working!</span>
            <span className="text-2xl animate-bounce">🎉</span>
          </div>
        </div>
      </div>
    </main>
  );
}