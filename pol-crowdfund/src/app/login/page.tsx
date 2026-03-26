'use client';

import { useState, useEffect } from 'react';
import { auth, googleProvider } from '../../firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) router.push('/'); // redirect if already logged in
    });
    return () => unsubscribe();
  }, [router]);

const signup = async () => {
  try {
    await createUserWithEmailAndPassword(auth, email, password);
  } catch (err: unknown) {
    if (err instanceof Error) {
      alert(`❌ Signup error: ${err.message}`);
    }
  }
};


  const login = async () => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/');
    } catch (err: unknown) {
  if (err instanceof Error) {
    alert(err.message); // safe access
  } else {
    alert('An unexpected error occurred');
  }


    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      router.push('/');
    } catch (err: unknown) {
        
  if (err instanceof Error) {
    alert(err.message); // safe access
  } else {
    alert('An unexpected error occurred');
  }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (err: unknown) {
  if (err instanceof Error) {
    alert(err.message); // safe access
  } else {
    alert('An unexpected error occurred');
  }
}

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
                disabled={loading}
                className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded font-bold mr-2 w-1/2 disabled:opacity-50"
              >
                Sign Up
              </button>
              <button
                onClick={login}
                disabled={loading}
                className="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded font-bold w-1/2 disabled:opacity-50"
              >
                Login
              </button>
            </div>
            <button
              onClick={loginWithGoogle}
              disabled={loading}
              className="bg-yellow-500 hover:bg-yellow-600 px-4 py-2 rounded font-bold w-full disabled:opacity-50"
            >
              Login with Google
            </button>
          </>
        )}
      </div>
    </div>
  );
}
