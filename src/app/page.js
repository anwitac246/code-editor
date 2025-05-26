'use client';
import React, { useState, useEffect ,Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase-config';
import CodeEditorWindow from '@/components/code_window';
import axios from 'axios';
import { FiTrash2, FiLogOut } from 'react-icons/fi';
import { FaSpinner } from 'react-icons/fa';

function HomeContent() {
  const [user, setUser] = React.useState(null);
  const [deleteLoading, setDeleteLoading] = React.useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId');

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      console.log('Auth state changed:', authUser ? `User logged in: ${authUser.uid}` : 'No user');
      setUser(authUser);
      if (authUser && !projectId) {
        console.log('User authenticated, redirecting to /dashboard');
        router.push('/dashboard');
      }
    });
    return () => unsubscribe();
  }, [router, projectId]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      console.log('User logged out');
      setUser(null);
      router.push('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleLoginRedirect = () => {
    console.log('Redirecting to /login');
    router.push('/login');
  };

  const handleGuestMode = () => {
    console.log('Redirecting to /guest');
    router.push('/guest');
  };

  const handleDeleteProject = async () => {
    if (!projectId || !user?.uid) {
      console.error('Missing projectId or uid');
      alert('Cannot delete project: Missing project or user information');
      return;
    }

    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }

    setDeleteLoading(true);
    try {
      const response = await axios.delete(
        `/api/projects/${projectId}?uid=${user.uid}`
      );
      console.log(`Project deleted: projectId=${projectId}`, response.data);
      alert('Project deleted successfully');
      router.push('/dashboard');
    } catch (error) {
      console.error('Error deleting project:', error);
      console.error('Error details:', {
        status: error.response?.status,
        data: error.response?.data,
      });
      alert('Failed to delete project. Please try again.');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="relative flex flex-col h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="animate-particle bg-white/10 w-1 h-1 rounded-full absolute top-1/4 left-1/4"></div>
          <div className="animate-particle-delayed bg-white/10 w-1 h-1 rounded-full absolute top-3/4 left-3/4"></div>
          <div className="animate-particle bg-white/5 w-2 h-2 rounded-full absolute top-1/2 left-1/3"></div>
        </div>

        <header className="px-6 py-4 bg-gray-900/30 backdrop-blur-lg border-b border-gray-700/50 flex items-center justify-between sticky top-0 z-10">
          <h1 className="text-3xl font-bold font-mono bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-purple-500 animate-pulse-slow">
            CodeCraft
          </h1>
          <button
            onClick={handleLoginRedirect}
            className="relative text-white bg-gradient-to-r from-teal-500 to-teal-700 hover:from-teal-400 hover:to-teal-600 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            aria-label="Login to CodeCraft"
          >
            Login
          </button>
        </header>

=        <main className="flex-1 flex items-center justify-center text-white px-4">
          <div className="text-center max-w-2xl animate-fade-in-up">
            <h1 className="text-5xl md:text-6xl font-extrabold mb-6 leading-tight bg-clip-text text-transparent bg-gradient-to-r from-teal-400 via-indigo-400 to-purple-400">
              Unleash Your Code with CodeCraft
            </h1>
            <p className="text-lg md:text-xl text-gray-200 mb-8 font-light">
              Build, edit, and collaborate on projects seamlessly. Start coding instantly as a guest or sign up for full access.
            </p>
            <div className="flex gap-4 justify-center">
              <a
                href="/login"
                className="relative inline-block px-8 py-4 bg-gradient-to-r from-teal-500 to-indigo-500 hover:from-teal-400 hover:to-indigo-400 text-white font-semibold rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 group overflow-hidden"
                aria-label="Get Started with CodeCraft"
              >
                <span className="relative z-10">Get Started</span>
                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </a>
              <button
                onClick={handleGuestMode}
                className="relative inline-block px-8 py-4 bg-gradient-to-r from-gray-700 to-gray-600 hover:from-gray-600 hover:to-gray-500 text-white font-semibold rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 group overflow-hidden"
                aria-label="Try CodeCraft in Guest Mode"
              >
                <span className="relative z-10">Guest Mode</span>
                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (projectId) {
    return (
      <div className="flex flex-col h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900">
        <header className="px-6 py-4 bg-gray-900/30 backdrop-blur-lg border-b border-gray-700/50 flex items-center justify-between sticky top-0 z-10">
          <h1 className="text-3xl font-bold font-mono bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-purple-500">
            CodeCraft
          </h1>
          <div className="flex gap-3">
            <button
              onClick={handleLogout}
              className="relative group text-white bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center gap-2"
              aria-label="Logout from CodeCraft"
            >
              <FiLogOut size={16} />
              <span>Logout</span>
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
            <button
              onClick={handleDeleteProject}
              disabled={deleteLoading}
              className={`relative group text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center gap-2 ${
                deleteLoading
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600'
              }`}
              aria-label="Delete Project"
            >
              {deleteLoading ? (
                <FaSpinner className="animate-spin" size={16} />
              ) : (
                <FiTrash2 size={16} />
              )}
              <span>{deleteLoading ? 'Deleting...' : 'Delete Project'}</span>
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          </div>
        </header>
        <main className="flex-1">
          <CodeEditorWindow projectId={projectId} uid={user.uid} />
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-purple-900">
      <header className="px-6 py-4 bg-gray-900/30 backdrop-blur-lg border-b border-gray-700/50 flex items-center justify-between sticky top-0 z-10">
        <h1 className="text-3xl font-bold font-mono bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-purple-500">
          CodeCraft
        </h1>
        <button
          onClick={handleLogout}
          className="relative group text-white bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center gap-2"
          aria-label="Logout from CodeCraft"
        >
          <FiLogOut size={16} />
          <span>Logout</span>
          <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </button>
      </header>
      <main className="flex-1 flex items-center justify-center text-white">
        <div className="text-center animate-pulse">
          <FaSpinner className="inline-block text-4xl animate-spin mb-4" />
          <p className="text-xl font-semibold">Loading your coding environment...</p>
        </div>
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-900 flex items-center justify-center text-gray-200">
          <FaSpinner className="inline-block text-4xl animate-spin mr-4" />
          Loading CodeCraft...
        </div>
      }
    >
      <HomeContent />
      <style jsx>{`
        @keyframes particle {
          0% { transform: translateY(0); opacity: 0.8; }
          100% { transform: translateY(-100vh); opacity: 0; }
        }
        @keyframes particleDelayed {
          0% { transform: translateY(0); opacity: 0.8; }
          100% { transform: translateY(100vh); opacity: 0; }
        }
        @keyframes pulseSlow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        .animate-particle {
          animation: particle 10s linear infinite;
        }
        .animate-particle-delayed {
          animation: particleDelayed 12s linear infinite;
        }
        .animate-pulse-slow {
          animation: pulseSlow 4s ease-in-out infinite;
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </Suspense>
  );
}