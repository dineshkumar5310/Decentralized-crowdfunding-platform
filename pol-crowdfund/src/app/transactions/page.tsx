'use client';

import React, { useState, useEffect } from 'react';
import { BrowserProvider } from 'ethers';

interface Campaign {
  id: string;
  owner: string;
  title: string;
  description: string;
  goal: string;
  raised: string;
  deadline: string;
  minContribution: string;
  uniqueDonors: string;
  withdrawn: boolean;
}

interface Contribution {
  id: string;
  campaignId: string;
  amount: string;
  timestamp: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

export default function TransactionsPage() {
  const [userAddress, setUserAddress] = useState<string>('');
  const [ownedCampaigns, setOwnedCampaigns] = useState<Campaign[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const getUserAddress = async () => {
    if (!window.ethereum) {
      setError('MetaMask is not installed');
      return;
    }
    try {
      const provider = new BrowserProvider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      setUserAddress(address);
      setError(null);
    } catch (err) {
      setError('Failed to get wallet address');
      console.error(err);
    }
  };

  // Fetch transactions data for user
  const fetchTransactions = async (address: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/transactions/${address}`);
      if (!response.ok) throw new Error('Failed to fetch transactions');
      const data = await response.json();
      setOwnedCampaigns(data.ownedCampaigns || []);
      setContributions(data.contributions || []);
    } catch (error) {
      setError('Failed to load transactions');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getUserAddress();
  }, []);

  useEffect(() => {
    if (userAddress) {
      fetchTransactions(userAddress);
    }
  }, [userAddress]);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-2 md:px-6 max-w-5xl mx-auto space-y-8">
      <div className="flex justify-center">
        <button
          onClick={getUserAddress}
          className="mb-6 px-5 py-3 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700 transition"
        >
          {userAddress
            ? `Connected: ${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`
            : 'Connect Wallet'}
        </button>
      </div>
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg max-w-lg mx-auto">
          {error}
        </div>
      )}
      {loading ? (
        <p className="text-center text-lg text-gray-600">Loading transactions...</p>
      ) : (
        <>
          <section>
            <h2 className="text-2xl font-bold mb-5 text-gray-900 text-center">Owned Campaigns</h2>
            {ownedCampaigns.length === 0 ? (
              <p className="text-center text-gray-500">No campaigns found.</p>
            ) : (
              <div className="grid gap-5 md:grid-cols-2">
                {ownedCampaigns.map((campaign) => (
                  <div key={campaign.id} className="border bg-white p-6 rounded-lg shadow transition hover:shadow-lg">
                    <h3 className="text-xl font-semibold mb-2">{campaign.title}</h3>
                    <p className="mb-2 text-gray-700">{campaign.description}</p>
                    <div className="mb-2 text-sm text-gray-600">
                      <span className="font-medium">Goal:</span> {campaign.goal} MATIC
                    </div>
                    <div className="mb-2 text-sm text-gray-600">
                      <span className="font-medium">Raised:</span> {campaign.raised} MATIC
                    </div>
                    <div className="mb-2 text-sm text-gray-600">
                      <span className="font-medium">Deadline:</span> {new Date(Number(campaign.deadline) * 1000).toLocaleString()}
                    </div>
                    <div className="mb-2 text-sm text-gray-600">
                      <span className="font-medium">Donors:</span> {campaign.uniqueDonors}
                    </div>
                    <div className={`font-bold ${campaign.withdrawn ? "text-red-600" : "text-green-600"}`}>
                      Status: {campaign.withdrawn ? 'Withdrawn' : 'Active'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="mt-10">
            <h2 className="text-2xl font-bold mb-5 text-gray-900 text-center">Your Contributions</h2>
            {contributions.length === 0 ? (
              <p className="text-center text-gray-500">No contributions found.</p>
            ) : (
              <div className="grid gap-5 md:grid-cols-2">
                {contributions.map((contrib) => (
                  <div key={contrib.id} className="border bg-white p-6 rounded-lg shadow transition hover:shadow-lg">
                    <div className="mb-2 text-sm text-gray-800">
                      <span className="font-medium">Campaign ID:</span> {contrib.campaignId}
                    </div>
                    <div className="mb-2 text-sm text-gray-800">
                      <span className="font-medium">Amount:</span> {contrib.amount} MATIC
                    </div>
                    <div className="mb-2 text-sm text-gray-800">
                      <span className="font-medium">Date:</span> {new Date(contrib.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
