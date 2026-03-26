"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged, signOut, User } from "firebase/auth";

export default function Navigation() {
  const [user, setUser] = useState<User | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <nav className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white shadow-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
              <span className="text-purple-600 font-bold text-lg">P</span>
            </div>
            <span className="font-bold text-xl tracking-tight">POL Crowdfunding</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="hover:text-purple-200 transition-colors duration-200 font-medium">
              Home
            </Link>
            <Link href="/create-campaign" className="hover:text-purple-200 transition-colors duration-200 font-medium">
              Create Campaign
            </Link>
            <Link href="/donate" className="hover:text-purple-200 transition-colors duration-200 font-medium">
              Donate
            </Link>
            <Link href="/transactions" className="hover:text-purple-200 transition-colors duration-200 font-medium">
              Transactions
            </Link>

            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm bg-white/20 px-3 py-1 rounded-full">
                  {user.email?.split('@')[0]}
                </span>
                <button
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="bg-white text-purple-600 px-6 py-2 rounded-lg font-semibold hover:bg-purple-50 transition-colors duration-200 shadow-lg"
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-white hover:text-purple-200 focus:outline-none focus:text-purple-200"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden bg-purple-700 rounded-lg mt-2 p-4 space-y-2">
            <Link
              href="/"
              className="block hover:text-purple-200 transition-colors duration-200 font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/create-campaign"
              className="block hover:text-purple-200 transition-colors duration-200 font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              Create Campaign
            </Link>
            <Link
              href="/donate"
              className="block hover:text-purple-200 transition-colors duration-200 font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              Donate
            </Link>
            <Link
              href="/transactions"
              className="block hover:text-purple-200 transition-colors duration-200 font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              Transactions
            </Link>

            {user ? (
              <div className="pt-2 border-t border-purple-500">
                <span className="block text-sm mb-2">{user.email?.split('@')[0]}</span>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                  className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg font-medium w-full text-left"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="block bg-white text-purple-600 px-4 py-2 rounded-lg font-semibold text-center hover:bg-purple-50 transition-colors duration-200"
                onClick={() => setIsMenuOpen(false)}
              >
                Login
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
