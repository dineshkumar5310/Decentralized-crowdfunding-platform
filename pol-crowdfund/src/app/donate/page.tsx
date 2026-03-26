'use client';

import React, { useState, useEffect } from 'react';
import { BrowserProvider, ethers } from 'ethers';

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

interface Campaign {
  id: number;
  title: string;
  goalAmount: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

export default function DonatePage(): React.ReactElement {
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [address, setAddress] = useState<string>('');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(null);
  const [donationAmount, setDonationAmount] = useState<string>('0.01');
  const [txPending, setTxPending] = useState<boolean>(false);

  const connectWallet = async (): Promise<void> => {
    if (!window.ethereum) {
      alert('MetaMask not detected');
      return;
    }
    try {
      const prov = new BrowserProvider(window.ethereum);
      await prov.send('eth_requestAccounts', []);
      const network = await prov.getNetwork();
      if (Number(network.chainId) !== 137) {
        alert('Please switch MetaMask to Polygon Mainnet');
        return;
      }
      const signer = await prov.getSigner();
      const acct = await signer.getAddress();
      setProvider(prov);
      setAddress(acct);
    } catch (error) {
      console.error(error);
      alert('Failed to connect wallet');
    }
  };

  const fetchCampaigns = async (): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/campaigns`);
      const data: Campaign[] = await response.json();
      setCampaigns(data);
    } catch (error) {
      console.error('Fetch campaigns error:', error);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleDonate = async (): Promise<void> => {
    if (!provider || !address || !selectedCampaignId) {
      alert('Connect wallet and select campaign first');
      return;
    }
    try {
      setTxPending(true);

      const response = await fetch(`${API_BASE_URL}/campaigns/${selectedCampaignId}/donate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ donor: address, amount: donationAmount }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Donation failed');
      }

      alert('Donation successful!');
      setDonationAmount('0.01');
    } catch (error) {
      console.error('Donation error:', error);
      alert('Failed to donate');
    } finally {
      setTxPending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 max-w-lg mx-auto space-y-6">
      <button
        className="mb-6 px-5 py-3 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700 transition"
        onClick={connectWallet}
      >
        {address
          ? `Connected: ${address.slice(0, 6)}...${address.slice(-4)}`
          : 'Connect MetaMask Wallet'}
      </button>

      <h2 className="text-3xl font-bold mb-8 text-gray-900 text-center">Donate to Campaign</h2>

      <form
        className="bg-white p-8 rounded-lg shadow-md space-y-6"
        onSubmit={e => {
          e.preventDefault();
          handleDonate();
        }}
      >
        <div>
          <label className="block mb-2 font-medium text-gray-700">Select a Campaign</label>
          <select
            className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={selectedCampaignId ?? ''}
            onChange={e => setSelectedCampaignId(Number(e.target.value))}
            required
          >
            <option value="" disabled>
              -- Select a campaign --
            </option>
            {campaigns.map((camp) => (
              <option key={camp.id} value={camp.id}>
                {camp.title} (Goal: {camp.goalAmount} MATIC)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-2 font-medium text-gray-700">Donation Amount (MATIC)</label>
          <input
            type="number"
            min="0.001"
            step="0.001"
            className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
            value={donationAmount}
            onChange={e => setDonationAmount(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          disabled={txPending || !selectedCampaignId}
          className="w-full py-3 bg-green-600 text-white rounded font-semibold hover:bg-green-700 transition"
        >
          {txPending ? 'Donating...' : 'Donate'}
        </button>
      </form>
    </div>
  );
}
