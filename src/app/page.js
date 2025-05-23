'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase-config';
import CodeEditorWindow from '@/components/code_window';

export default function Home() {
  const [code, setCode] = useState('// Start typing your code here...');
  const [theme, setTheme] = useState('vs-dark');
  const [user, setUser] = useState(null);
  const router = useRouter();

  const handleCodeChange = (type, newCode) => {
    if (type === 'code') {
      setCode(newCode);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    router.push('/login');
  };

  const handleLoginRedirect = () => {
    router.push('/login');
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="px-6 py-4 bg-gray-900/80 backdrop-blur-sm border-b border-gray-700 flex items-center justify-between">
        <h1 className="text-white text-3xl font-bold">CodeCraft</h1>
        {user ? (
          <button
            onClick={handleLogout}
            className="text-white bg-teal-600 hover:bg-teal-700 px-4 py-2 rounded-md text-sm transition"
          >
            Logout
          </button>
        ) : (
          <button
            onClick={handleLoginRedirect}
            className="text-white bg-teal-600 hover:bg-teal-700 px-4 py-2 rounded-md text-sm transition"
          >
            Login
          </button>
        )}
      </div>

      <CodeEditorWindow
        onChange={handleCodeChange}
        code={code}
        theme={theme}
        initialLanguage="cpp"
      />
    </div>
  );
}
