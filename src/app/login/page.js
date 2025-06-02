'use client';
import { useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithPopup,
  fetchSignInMethodsForEmail
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase-config';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const methods = await fetchSignInMethodsForEmail(auth, email);
        if (methods.length > 0) {
          throw new Error('An account with this email already exists.');
        }
        await createUserWithEmailAndPassword(auth, email, password);
      }
      router.push('/');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    try {
      await signInWithPopup(auth, googleProvider);
      router.push('/dashboard');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email to reset password.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setError('Password reset link sent to your email.');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="flex min-h-screen text-white">
      
      <div className="w-1/2 bg-gradient-to-br from-teal-600 to-blue-700 p-12 flex flex-col justify-center">
        <h1 className="text-4xl font-bold mb-4 font-mono">CodeCraft</h1>
        <p className="text-lg leading-relaxed text-white/90">
          Your personalized cloud-based code editor with real-time collaboration,
          intelligent suggestions, and integrated te rminal. Code faster, smarter,
          together — from anywhere.
        </p>
        <ul className="mt-6 list-disc pl-5 text-white/80 space-y-1">
          <li>Live multi-user editing</li>
          <li>Inline AI code suggestions</li>
          <li>Automatic code fixes</li>
        </ul>
        <button className=" w-[50%] my-8 bg-blue-900 hover:bg-blue-950 text-white font-semibold py-2 px-6 rounded-xl shadow-md transition duration-300">
  <Link href="/guest">Try in Guest Mode</Link>
</button>

      </div>

      
      <div className="w-1/2 bg-[#1e1e1e] flex items-center justify-center p-12">
        <div className="w-full max-w-md bg-[#252526] rounded-lg shadow-lg p-8 border border-gray-700">
          <h2 className="text-2xl font-bold mb-6 text-center">
            {isLogin ? 'Welcome Back' : 'Create Your Account'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              className="w-full px-4 py-2 rounded bg-[#1e1e1e] border border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500 text-white placeholder-gray-400"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              className="w-full px-4 py-2 rounded bg-[#1e1e1e] border border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500 text-white placeholder-gray-400"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {isLogin && (
              <div className="text-right text-sm text-teal-400 hover:underline cursor-pointer" onClick={handleForgotPassword}>
                Forgot password?
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded transition"
            >
              {isLogin ? 'Login with Email' : 'Create Account'}
            </button>
          </form>

          <div className="my-4 text-center text-sm text-gray-400">or</div>

          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-2 py-2 bg-gray-800 hover:bg-gray-700 text-white border border-gray-600 font-semibold rounded transition"
          >
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="Google"
              className="h-5 w-5"
            />
            Continue with Google
          </button>

          {error && (
            <p className="mt-4 text-red-400 text-sm text-center">{error}</p>
          )}

          <div className="mt-6 text-center text-sm text-gray-400">
            {isLogin ? (
              <>
                Don’t have an account?{' '}
                <span
                  className="text-teal-400 hover:underline cursor-pointer"
                  onClick={() => {
                    setIsLogin(false);
                    setError('');
                  }}
                >
                  Sign up
                </span>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <span
                  className="text-teal-400 hover:underline cursor-pointer"
                  onClick={() => {
                    setIsLogin(true);
                    setError('');
                  }}
                >
                  Login
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
