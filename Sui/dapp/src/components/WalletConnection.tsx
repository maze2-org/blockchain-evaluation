import { useState, useEffect } from 'react';
import { useWallet } from '@suiet/wallet-kit';
import { SuiClient } from '@mysten/sui/client';
import { Wallet, LogOut, AlertCircle } from 'lucide-react';
import {NETWORK} from "../config/config.ts";

interface WalletConnectionProps {
  suiClient: SuiClient | null;
}

export default function WalletConnection({ suiClient }: WalletConnectionProps) {
  const {
    select,
    account,
    adapter,
    connected,
    connecting,
    disconnect,
    allAvailableWallets,
  } = useWallet();

  const [balance, setBalance] = useState<string>('0');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (connected && account && suiClient) {
      fetchBalance();
    }
  }, [connected, account, suiClient]);

  const fetchBalance = async () => {
    if (!account || !suiClient) return;

    try {
      const balance = await suiClient.getBalance({
        owner: account.address,
      });

      const suiBalance = (
        parseInt(balance.totalBalance) / 1_000_000_000
      ).toFixed(4);
      setBalance(suiBalance);
    } catch (error) {
      console.error('Error fetching balance:', error);
      setError('Failed to fetch balance');
    }
  };

  const handleWalletConnect = async (walletName: string) => {
    try {
      setError('');
      await select(walletName);
    } catch (err) {
      setError(err?.message || 'Failed to connect wallet');
      console.error('Failed to connect wallet:', err);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      setBalance('0');
      setError('');
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    }
  };

  if (!connected) {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-lg border border-cyan-200">
        <div className="text-center">
          <Wallet className="mx-auto h-12 w-12 text-cyan-600 mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Connect Wallet
          </h2>
          <p className="text-slate-600 mb-6">
            Connect your Sui wallet to interact with the IABS token contract.
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
              <AlertCircle
                className="text-red-500 mt-0.5 flex-shrink-0"
                size={20}
              />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <div className="flex flex-col gap-4 justify-center">
            {allAvailableWallets.map((wallet) => (
              <button
                key={wallet.name}
                onClick={() => handleWalletConnect(wallet.name)}
                disabled={connecting}
                className="block cursor-pointer bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-300 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                {connecting ? 'Connecting...' : wallet.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-8 shadow-lg border border-cyan-200">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Wallet Connected</h2>
        <button
          onClick={handleDisconnect}
          className="flex cursor-pointer items-center space-x-2 text-slate-600 hover:text-slate-800 transition-colors"
        >
          <LogOut size={20} />
          <span>Disconnect</span>
        </button>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-50 p-4 rounded-lg">
            <div className="text-sm text-slate-600">Wallet</div>
            <div className="font-semibold text-slate-900">
              {adapter?.name || 'Connected'}
            </div>
          </div>
          <div className="bg-slate-50 p-4 rounded-lg">
            <div className="text-sm text-slate-600">Balance</div>
            <div className="font-semibold text-slate-900">{balance} SUI</div>
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-lg">
          <div className="text-sm text-slate-600">Address</div>
          <div className="font-mono text-sm text-slate-900 break-all">
            {account?.address || 'No address available'}
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-lg">
          <div className="text-sm text-slate-600">Network</div>
          <div className="font-semibold text-slate-900">Sui {NETWORK}</div>
        </div>
      </div>
    </div>
  );
}
