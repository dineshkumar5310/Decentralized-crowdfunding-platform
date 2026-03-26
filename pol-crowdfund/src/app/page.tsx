'use client';

import React, { useCallback, useState, useEffect } from 'react';
import { BrowserProvider, JsonRpcSigner } from 'ethers';

// Proper Ethereum type
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

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

type Campaign = {
  id: number;
  owner: string;
  title: string;
  description: string;
  category: string;
  imageURL: string;
  goal: number;
  raised: number;
  deadline: number;
  minContribution: number;
  uniqueDonors: number;
  withdrawn: boolean;
  goalEther: string;
  raisedEther: string;
  deadlineUnix: number;
  minContributionEther: string;
};

export default function Page(): React.ReactElement {
  const [, setProvider] = useState<BrowserProvider | null>(null);
  const [address, setAddress] = useState<string>('');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [txPending, setTxPending] = useState(false);
  const [stats, setStats] = useState({
    totalCampaigns: 0,
    totalRaised: '0',
    totalDonors: 0,
  });

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/campaigns`);
      if (!response.ok) throw new Error('Failed to fetch campaigns');

      const data: Campaign[] = await response.json();

      const out = data.map((c) => ({
        ...c,
        goalEther: c.goal?.toString() || '0',
        raisedEther: c.raised?.toString() || '0',
        deadlineUnix: c.deadline ?? 0,
        minContributionEther: c.minContribution?.toString() || '0',
      }));

      let totalRaised = 0;
      let totalDonors = 0;

      out.forEach((c) => {
        totalRaised += c.raised;
        totalDonors += c.uniqueDonors;
      });

      setCampaigns(out);
      setStats({
        totalCampaigns: out.length,
        totalRaised: totalRaised.toFixed(2),
        totalDonors,
      });
    } catch (err) {
      console.error('fetchCampaigns error', err);
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const connectWallet = useCallback(async () => {
    if (!window.ethereum) return alert('MetaMask not found');

    try {
      const prov = new BrowserProvider(window.ethereum);
      await prov.send('eth_requestAccounts', []);
      const signer: JsonRpcSigner = await prov.getSigner();
      const acct = await signer.getAddress();

      setProvider(prov);
      setAddress(acct);
      await fetchCampaigns();
    } catch (err) {
      console.error('connectWallet error', err);
      alert('Failed to connect wallet');
    }
  }, [fetchCampaigns]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  // ✅ FIXED
  const handleContribute = async (
    campaignId: number,
    amountEther: string
  ) => {
    if (!address) return alert('Connect wallet first');

    try {
      setTxPending(true);

      const response = await fetch(
        `${API_BASE_URL}/campaigns/${campaignId}/donate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ donor: address, amount: amountEther }),
        }
      );

      const text = await response.text();
      const result = text ? JSON.parse(text) : {};

      if (!response.ok)
        throw new Error(result.error || 'Contribution failed');

      alert('Contribution successful');
      await fetchCampaigns();
    } catch (err) {
      console.error(err);
      alert('Contribution failed');
    } finally {
      setTxPending(false);
    }
  };

  // ✅ FIXED
  const handleWithdraw = async (campaignId: number) => {
    if (!address) return alert('Connect wallet first');

    try {
      setTxPending(true);

      const response = await fetch(
        `${API_BASE_URL}/campaigns/${campaignId}/withdraw`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ owner: address }),
        }
      );

      const text = await response.text();
      const result = text ? JSON.parse(text) : {};

      if (!response.ok)
        throw new Error(result.error || 'Withdraw failed');

      alert('Withdraw successful');
      await fetchCampaigns();
    } catch (err) {
      console.error(err);
      alert('Withdraw failed');
    } finally {
      setTxPending(false);
    }
  };

  // ✅ FIXED
  const handleRefund = async (campaignId: number) => {
    if (!address) return alert('Connect wallet first');

    try {
      setTxPending(true);

      const response = await fetch(
        `${API_BASE_URL}/campaigns/${campaignId}/refund`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ owner: address }),
        }
      );

      const text = await response.text();
      const result = text ? JSON.parse(text) : {};

      if (!response.ok)
        throw new Error(result.error || 'Refund failed');

      alert('Refund attempted');
      await fetchCampaigns();
    } catch (err) {
      console.error(err);
      alert('Refund failed');
    } finally {
      setTxPending(false);
    }
  };

  const getTimeLeft = (deadlineUnix: number) => {
    const now = Math.floor(Date.now() / 1000);
    const diff = deadlineUnix - now;
    if (diff <= 0) return 'Ended';

    const days = Math.floor(diff / (24 * 3600));
    const hrs = Math.floor((diff % (24 * 3600)) / 3600);

    return `${days}d ${hrs}h`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 animate-pulse"></div>
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-10 left-10 w-20 h-20 bg-purple-500/30 rounded-full animate-bounce"></div>
        <div className="absolute top-20 right-20 w-16 h-16 bg-blue-500/30 rounded-full animate-ping"></div>
        <div className="absolute bottom-20 left-20 w-24 h-24 bg-indigo-500/30 rounded-full animate-pulse"></div>
      </div>

      <div className="relative z-10">
        {/* Hero Section */}
        <section className="min-h-screen flex items-center justify-center px-4 py-20">
          <div className="max-w-6xl mx-auto text-center">
            <h1 className="text-6xl md:text-8xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-6 animate-fade-in">
              POL Crowdfunding
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Empower innovation with blockchain-powered crowdfunding. Support groundbreaking projects on Polygon network with transparent, secure donations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button
                onClick={connectWallet}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-4 rounded-full font-bold text-lg shadow-2xl transform hover:scale-105 transition-all duration-300 animate-bounce"
              >
                {address ? `Connected: ${address.slice(0, 6)}...${address.slice(-4)}` : '🚀 Connect MetaMask Wallet'}
              </button>
              <button className="border-2 border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-white px-8 py-4 rounded-full font-bold text-lg transition-all duration-300">
                Learn More
              </button>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
                <div className="text-4xl font-bold text-white mb-2">{stats.totalCampaigns}</div>
                <div className="text-purple-300">Active Campaigns</div>
              </div>
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
                <div className="text-4xl font-bold text-white mb-2">{stats.totalRaised} ETH</div>
                <div className="text-purple-300">Total Raised</div>
              </div>
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center hover:bg-white/20 transition-all duration-300 transform hover:scale-105">
                <div className="text-4xl font-bold text-white mb-2">{stats.totalDonors}</div>
                <div className="text-purple-300">Total Donors</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-center text-white mb-12">Why Choose POL Crowdfunding?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center hover:bg-white/20 transition-all duration-300">
                <div className="text-6xl mb-4">🔒</div>
                <h3 className="text-xl font-bold text-white mb-4">Secure & Transparent</h3>
                <p className="text-gray-300">Blockchain-powered smart contracts ensure every transaction is secure and verifiable.</p>
              </div>
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center hover:bg-white/20 transition-all duration-300">
                <div className="text-6xl mb-4">⚡</div>
                <h3 className="text-xl font-bold text-white mb-4">Fast & Low Cost</h3>
                <p className="text-gray-300">Leverage Polygon network for lightning-fast transactions with minimal fees.</p>
              </div>
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center hover:bg-white/20 transition-all duration-300">
                <div className="text-6xl mb-4">🌍</div>
                <h3 className="text-xl font-bold text-white mb-4">Global Reach</h3>
                <p className="text-gray-300">Connect with supporters worldwide without borders or intermediaries.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Campaigns Section */}
        <section className="py-16 px-4">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-4xl font-bold text-center text-white mb-12">Featured Campaigns</h2>
            {loading ? (
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-400 mx-auto"></div>
                <p className="mt-4 text-gray-300 text-xl">Loading amazing campaigns...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {campaigns.map((c, index) => (
                  <div
                    key={c.id}
                    className="bg-white/10 backdrop-blur-lg rounded-2xl overflow-hidden hover:bg-white/20 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl animate-fade-in"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {c.imageURL && (
                      <div className="relative">
                        <img src={c.imageURL} alt={c.title} className="w-full h-48 object-cover" loading="lazy" />
                        <div className="absolute top-4 left-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                          {c.category || 'General'}
                        </div>
                        {index < 3 && (
                          <div className="absolute top-4 right-4 bg-yellow-500 text-black px-3 py-1 rounded-full text-sm font-bold animate-pulse">
                            🔥 Trending
                          </div>
                        )}
                      </div>
                    )}
                    <div className="p-6">
                      <h3 className="font-bold text-xl mb-2 text-white">{c.title}</h3>
                      <p className="text-gray-300 mb-4 line-clamp-3">{c.description}</p>
                      <div className="mb-4">
                        <div className="flex justify-between text-sm text-gray-400 mb-2">
                          <span>Raised: {c.raisedEther} ETH</span>
                          <span>Goal: {c.goalEther} ETH</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${Math.min((parseFloat(c.raisedEther) / parseFloat(c.goalEther)) * 100, 100)}%` }}
                          ></div>
                        </div>
                        <div className="text-right text-sm text-gray-400 mt-1">
                          {Math.min((parseFloat(c.raisedEther) / parseFloat(c.goalEther)) * 100, 100).toFixed(1)}%
                        </div>
                      </div>
                      <div className="flex justify-between text-sm text-gray-400 mb-4">
                        <span>Min: {c.minContributionEther} ETH</span>
                        <span>Time: {getTimeLeft(c.deadlineUnix)}</span>
                      </div>
                      <div className="flex flex-col gap-3">
                        <ContributeBox campaign={c} onContribute={handleContribute} txPending={txPending} />
                        {c.owner.toLowerCase() === address.toLowerCase() && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleWithdraw(c.id)}
                              disabled={txPending}
                              className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-4 py-2 rounded-lg font-semibold flex-1 transition-all duration-300 transform hover:scale-105"
                            >
                              Withdraw
                            </button>
                            <button
                              onClick={() => handleRefund(c.id)}
                              disabled={txPending}
                              className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-4 py-2 rounded-lg font-semibold flex-1 transition-all duration-300 transform hover:scale-105"
                            >
                              Refund
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-16 px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl font-bold text-center text-white mb-12">Success Stories</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 hover:bg-white/20 transition-all duration-300">
                <p className="text-gray-300 mb-4 italic">&ldquo;POL Crowdfunding helped us raise funds for our innovative startup in just weeks. The transparency and speed were incredible!&rdquo;</p>
                <div className="text-purple-300 font-bold">- Sarah Chen, Tech Entrepreneur</div>
              </div>
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 hover:bg-white/20 transition-all duration-300">
                <p className="text-gray-300 mb-4 italic">&ldquo;As a donor, I love the security and global reach. Supporting projects worldwide has never been easier.&rdquo;</p>
                <div className="text-purple-300 font-bold">- Mike Johnson, Impact Investor</div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 px-4 border-t border-white/20">
          <div className="max-w-6xl mx-auto text-center">
            <div className="flex justify-center items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mr-4">
                <span className="text-white font-bold text-xl">P</span>
              </div>
              <span className="text-2xl font-bold text-white">POL Crowdfunding</span>
            </div>
            <p className="text-gray-400 mb-6">Empowering innovation through decentralized crowdfunding</p>
            <div className="flex justify-center space-x-6">
              <a href="#" className="text-gray-400 hover:text-purple-400 transition-colors">Twitter</a>
              <a href="#" className="text-gray-400 hover:text-purple-400 transition-colors">Discord</a>
              <a href="#" className="text-gray-400 hover:text-purple-400 transition-colors">GitHub</a>
            </div>
            <p className="text-gray-500 text-sm mt-6">© 2024 POL Crowdfunding. Built on Polygon.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}

// ✅ ONLY ONE ContributeBox (final version)
type ContributeBoxProps = {
  campaign: Campaign;
  onContribute: (campaignId: number, amountEther: string) => void;
  txPending: boolean;
};

function ContributeBox({
  campaign,
  onContribute,
  txPending,
}: ContributeBoxProps) {
  const [amount, setAmount] = useState('0.01');

  return (
    <div className="flex gap-3">
      <input
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="ETH Amount"
        type="number"
        step="0.001"
        className="bg-white/20 border border-white/30 text-white p-3 rounded-lg flex-1"
      />
      <button
        onClick={() => onContribute(campaign.id, amount)}
        disabled={txPending}
        className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg"
      >
        {txPending ? 'Processing...' : 'Contribute'}
      </button>
    </div>
  );
}