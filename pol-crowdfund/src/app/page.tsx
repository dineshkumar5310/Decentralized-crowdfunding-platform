'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { auth, googleProvider } from '../firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { BrowserProvider, Contract, parseEther, formatEther } from 'ethers';

// Declare window.ethereum for TypeScript
declare global {
  interface Window {
    ethereum?: import('ethers').Eip1193Provider;
  }
}

export default function HomePage() {
  // 🔹 Firebase Auth State
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // 🔹 Polygon Wallet State
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [address, setAddress] = useState('');
  const [balance, setBalance] = useState('0');
  const [amount, setAmount] = useState('');

  const contractAddress = '0x6947a66460E47D0DABf65269A49c9A7b384B989d';
  const contractABI = useMemo(
    () => [
      'function contribute() external payable',
      'event Contribution(address indexed from, uint amount)',
    ],
    []
  );

  // 🔹 Listen to Firebase auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // 🔹 Firebase signup
  const signup = async () => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      alert('✅ Signup successful!');
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(`❌ Signup error: ${err.message}`);
      } else {
        alert('❌ Signup failed');
      }
    }
  };

  // 🔹 Firebase login
  const login = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert('✅ Login successful!');
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(`❌ Login error: ${err.message}`);
      } else {
        alert('❌ Login failed');
      }
    }
  };

  // 🔹 Google login
  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      alert('✅ Google login successful!');
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(`❌ Google login error: ${err.message}`);
      } else {
        alert('❌ Google login failed');
      }
    }
  };

  // 🔹 Logout
  const logout = async () => {
    await signOut(auth);
    setAddress('');
    setProvider(null);
    alert('✅ Logged out!');
  };

  // 🔹 Connect MetaMask
  const connectWallet = useCallback(async () => {
    if (!window.ethereum) return alert('🦊 Install MetaMask!');
    const prov = new BrowserProvider(window.ethereum);
    const accounts = await prov.send('eth_requestAccounts', []);
    setProvider(prov);
    setAddress(accounts[0]);
  }, []);

  // 🔹 Switch to Polygon
  const switchToPolygon = useCallback(async () => {
    if (!window.ethereum) return alert('🦊 MetaMask not detected.');
    try {
      await window.ethereum.request?.({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x89' }], // Polygon Mainnet
      });
      await connectWallet();
      alert('✅ Switched to Polygon Mainnet');
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'code' in err) {
        const errorObj = err as { code?: number };
        if (errorObj.code === 4902) alert('⚠️ Polygon not found. Add manually.');
        else console.error(err);
      } else {
        console.error(err);
      }
    }
  }, [connectWallet]);

  // 🔹 Fetch balance
  const updateBalance = useCallback(async () => {
    if (provider && address) {
      const rawBalance = await provider.getBalance(address);
      setBalance(formatEther(rawBalance));
    }
  }, [provider, address]);

  useEffect(() => {
    updateBalance();
  }, [updateBalance]);

  // 🔹 Contribute POL
  const contribute = useCallback(async () => {
    if (!provider) return;
    const chainId = await window.ethereum?.request?.({ method: 'eth_chainId' });
    if (chainId !== '0x89') return alert("⚠️ Switch to Polygon Mainnet first!");

    const signer = await provider.getSigner();
    const contract = new Contract(contractAddress, contractABI, signer);

    try {
      await contract.contribute({ value: parseEther(amount), gasLimit: 100000 });
      alert('🎉 Contribution successful!');
      setAmount('');
      updateBalance();
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'code' in err) {
        const errorObj = err as { code?: string };
        if (errorObj.code === 'ACTION_REJECTED') alert('❌ Transaction rejected!');
        else alert('⚠️ Transaction failed.');
      } else {
        alert('⚠️ Transaction failed.');
      }
    }
  }, [provider, contractABI, amount, updateBalance]);

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-blue-700 to-blue-500 p-4 text-white">
      <div className="bg-black/50 p-8 rounded-xl shadow-lg w-full max-w-md text-center">
        <h1 className="text-2xl font-bold mb-6">🚀 POL Crowdfunding</h1>

        {!user ? (
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
        ) : (
          <>
            <p className="mb-4">Logged in as: {user.email}</p>
            <button
              onClick={logout}
              className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded font-bold mb-4"
            >
              Logout
            </button>

            <button
              onClick={connectWallet}
              className="bg-cyan-500 hover:bg-cyan-600 px-4 py-2 rounded font-bold mb-3 w-full"
            >
              {address ? `Connected: ${address.slice(0, 6)}...` : 'Connect Wallet'}
            </button>

            <button
              onClick={switchToPolygon}
              className="bg-orange-500 hover:bg-orange-600 px-4 py-2 rounded font-bold mb-3 w-full"
            >
              Switch to Polygon
            </button>

            {address && (
              <>
                <p className="mb-2">POL Balance: <strong>{balance}</strong></p>
                <input
                  type="text"
                  placeholder="Amount in POL"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="mb-3 w-full p-2 rounded text-black"
                />
                <button
                  onClick={contribute}
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-bold w-full"
                >
                  Contribute POL
                </button>
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
}
