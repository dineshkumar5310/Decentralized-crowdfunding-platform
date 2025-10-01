'use client';

import { useState, useEffect } from 'react';
import { auth, googleProvider } from '../firebase';

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState<User | null>(null);

  // Listen to auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Signup with email/password
  const signup = async () => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      alert('✅ Signup successful!');
    } catch (err: unknown) {
      alert(`❌ Signup error: ${(err as Error).message}`);
    }
  };

  // Login with email/password
  const login = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert('✅ Login successful!');
    } catch (err: unknown) {
      alert(`❌ Login error: ${(err as Error).message}`);
    }
  };

  // Login with Google
  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      alert('✅ Google login successful!');
    } catch (err: unknown) {
      alert(`❌ Google login error: ${(err as Error).message}`);
    }
  };

  // Logout
  const logout = async () => {
    await signOut(auth);
    alert('✅ Logged out!');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-blue-700 to-blue-500 p-4 text-white">
      <div className="bg-black/50 p-8 rounded-xl shadow-lg w-full max-w-md text-center">
        <h1 className="text-2xl font-bold mb-6">🚀 POL Crowdfunding</h1>

        {user ? (
          <>
            <p className="mb-4">Logged in as: {user.email}</p>
            <button
              onClick={logout}
              className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded font-bold"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mb-3 w-full p-2 rounded text-black"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mb-4 w-full p-2 rounded text-black"
            />
            <div className="flex justify-between mb-3">
              <button
                onClick={signup}
                className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded font-bold mr-2 w-1/2"
              >
                Sign Up
              </button>
              <button
                onClick={login}
                className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded font-bold w-1/2"
              >
                Login
              </button>
            </div>
            <button
              onClick={loginWithGoogle}
              className="bg-yellow-500 hover:bg-yellow-600 px-4 py-2 rounded font-bold w-full"
            >
              Login with Google
            </button>
          </>
        )}
      </div>
    </div>
  );
}
