'use client';
import React, { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import CodeEditorWindow from '@/components/code_window';

export default function Guest() {
  const router = useRouter();

  const handleLoginRedirect = () => {
    console.log('Redirecting to /login');
    router.push('/login');
  };

  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-900 flex items-center justify-center text-gray-200">Loading editor...</div>}>
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="px-6 py-4 bg-gray-900/80 backdrop-blur-sm border-b border-gray-700 flex items-center justify-between">
        <h1 className="text-white text-3xl font-bold font-mono">CodeCraft</h1>
        <button
          onClick={handleLoginRedirect}
          className="text-white bg-teal-600 hover:bg-teal-700 px-4 py-2 rounded-md text-sm transition"
        >
          Login
        </button>
      </div>
      <CodeEditorWindow />
    </div>
    </Suspense>
  );
}