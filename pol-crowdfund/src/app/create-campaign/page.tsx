'use client';

import React, { useState, useCallback } from 'react';
import { BrowserProvider } from 'ethers';

interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (eventName: string, callback: (...params: unknown[]) => void) => void;
  removeListener?: (eventName: string, callback: (...params: unknown[]) => void) => void;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

// ✅ FIXED (removed /api)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

export default function CreateCampaignPage(): React.ReactElement {
  const [, setProvider] = useState<BrowserProvider | null>(null);
  const [address, setAddress] = useState('');
  const [txPending, setTxPending] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [goal, setGoal] = useState('0.1');
  const [deadlineDays, setDeadlineDays] = useState(7);
  const [minContribution, setMinContribution] = useState('0.001');
  const [receiverAddress, setReceiverAddress] = useState('');

  // ✅ FIXED connectWallet (auto network switch)
  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      alert('MetaMask not detected');
      return;
    }

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x89" }],
      });
    } catch (error) {
      const switchError = error as { code?: number };

      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId: "0x89",
              chainName: "Polygon Mainnet",
              rpcUrls: ["https://polygon-rpc.com"],
              nativeCurrency: {
                name: "MATIC",
                symbol: "MATIC",
                decimals: 18,
              },
              blockExplorerUrls: ["https://polygonscan.com"],
            }],
          });
        } catch (addError) {
          console.error(addError);
          alert("Failed to add Polygon network");
          return;
        }
      } else {
        console.error(error);
        alert("Please switch to Polygon Mainnet");
        return;
      }
    }

    try {
      const prov = new BrowserProvider(window.ethereum);
      await prov.send('eth_requestAccounts', []);

      const signer = await prov.getSigner();
      const acct = await signer.getAddress();

      setProvider(prov);
      setAddress(acct);

    } catch (err) {
      console.error(err);
      alert('Failed to connect wallet');
    }
  }, []);

  const handleCreateCampaign = async () => {
    if (!address) {
      alert('Connect wallet first');
      return;
    }
    if (!title || !description || !goal || !receiverAddress) {
      alert('Please fill required fields');
      return;
    }

    try {
      setTxPending(true);

      const deadlineSec = Math.floor(Date.now() / 1000) + deadlineDays * 86400;

      const response = await fetch(`${API_BASE_URL}/campaigns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          category,
          image: '',
          goalAmount: parseFloat(goal),
          deadline: deadlineSec,
          minContribution: parseFloat(minContribution),
          owner: address,
          receiverAddress,
        }),
      });

      if (!response.ok) {
        const errBody = await response.json();
        throw new Error(errBody?.error || 'Failed to create campaign');
      }

      alert('Campaign created successfully');

      setTitle('');
      setDescription('');
      setCategory('');
      setGoal('0.1');
      setDeadlineDays(7);
      setMinContribution('0.001');
      setReceiverAddress('');

    } catch (err) {
      console.error(err);
      alert('Error creating campaign');
    } finally {
      setTxPending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 max-w-4xl mx-auto space-y-6">
      <button
        className="mb-6 px-5 py-3 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700 transition"
        onClick={connectWallet}
      >
        {address ? `Connected: ${address.slice(0,6)}...${address.slice(-4)}` : 'Connect MetaMask Wallet'}
      </button>

      <h2 className="text-3xl font-bold mb-8 text-gray-900 text-center">
        Create Campaign
      </h2>

      <form
  className="bg-white p-8 rounded-xl shadow-lg space-y-6"
  onSubmit={e => { e.preventDefault(); handleCreateCampaign(); }}
>
  {/* Title */}
  <div>
    <label className="block mb-2 font-medium text-gray-700">
      Campaign Title
    </label>
    <input
      type="text"
      value={title}
      onChange={e => setTitle(e.target.value)}
      placeholder="Enter campaign title"
      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400 focus:outline-none"
      required
    />
  </div>

  {/* Description */}
  <div>
    <label className="block mb-2 font-medium text-gray-700">
      Description
    </label>
    <textarea
      rows={4}
      value={description}
      onChange={e => setDescription(e.target.value)}
      placeholder="Describe your campaign in detail"
      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400 focus:outline-none"
      required
    />
  </div>

  {/* Category */}
  <div>
    <label className="block mb-2 font-medium text-gray-700">
      Category
    </label>
    <input
      type="text"
      value={category}
      onChange={e => setCategory(e.target.value)}
      placeholder="e.g. Education, Medical, Startup"
      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400 focus:outline-none"
    />
  </div>

  {/* Goal + Min Contribution */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div>
      <label className="block mb-2 font-medium text-gray-700">
        Funding Goal (MATIC)
      </label>
      <input
        type="number"
        step="0.0001"
        min="0"
        value={goal}
        onChange={e => setGoal(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400 focus:outline-none"
        required
      />
    </div>

    <div>
      <label className="block mb-2 font-medium text-gray-700">
        Minimum Contribution (MATIC)
      </label>
      <input
        type="number"
        step="0.0001"
        min="0"
        value={minContribution}
        onChange={e => setMinContribution(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400 focus:outline-none"
        required
      />
    </div>
  </div>

  {/* Deadline */}
  <div>
    <label className="block mb-2 font-medium text-gray-700">
      Deadline (in Days)
    </label>
    <input
      type="number"
      min="1"
      value={deadlineDays}
      onChange={e => setDeadlineDays(Number(e.target.value))}
      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400 focus:outline-none"
      required
    />
  </div>

  {/* Wallet Address */}
  <div>
    <label className="block mb-2 font-medium text-gray-700">
      Receiver Wallet Address
    </label>
    <input
      type="text"
      value={receiverAddress}
      onChange={e => setReceiverAddress(e.target.value)}
      placeholder="0x..."
      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400 focus:outline-none"
      required
    />
  </div>

  {/* Submit Button */}
  <button
    type="submit"
    disabled={txPending}
    className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition"
  >
    {txPending ? 'Creating Campaign...' : 'Create Campaign 🚀'}
  </button>
</form>
    </div>
  );
} 