import {ApiPromise} from '@polkadot/api';
import {formatBalance} from '@polkadot/util';
import {useState, useEffect} from 'react';
import {InjectedAccountWithMeta} from '@polkadot/extension-inject/types';
import {web3Accounts, web3Enable} from '@polkadot/extension-dapp';
import {Wallet, LogOut, AlertCircle} from 'lucide-react';

interface WalletConnectionProps {
  account: InjectedAccountWithMeta | null;
  setAccount: (account: InjectedAccountWithMeta | null) => void;
  api: ApiPromise | null;
}

export default function WalletConnection({account, setAccount, api}: WalletConnectionProps) {
  const [accounts, setAccounts] = useState<InjectedAccountWithMeta[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [balance, setBalance] = useState<string>('0');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (account && api) {
      fetchBalance();
    }
  }, [account, api]);

  const fetchBalance = async () => {
    if (!account || !api) return;

    try {
      const accountInfo = await api.query.system.account(account.address);
      const balance = (accountInfo as any).data || {free: 0};
      const formattedBalance = formatBalance(balance.free, {
        withZero: false,
        withUnit: 'SBY',
        forceUnit: 'SBY',
        decimals: api.registry.chainDecimals[0],
      });
      setBalance(formattedBalance);
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  const connectWallet = async () => {
    setIsLoading(true);
    setError('');

    try {
      const extensions = await web3Enable('IABS Token DApp');

      if (extensions.length === 0) {
        setError('No Polkadot extension found. Please install Polkadot.js extension.');
        setIsLoading(false);
        return;
      }

      const allAccounts = await web3Accounts();

      if (allAccounts.length === 0) {
        setError('No accounts found. Please create an account in your Polkadot extension.');
        setIsLoading(false);
        return;
      }

      setAccounts(allAccounts);

      if (!account && allAccounts.length > 0) {
        setAccount(allAccounts[0]);
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setError('Failed to connect wallet. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const disconnect = () => {
    setAccount(null);
    setAccounts([]);
    setBalance('0');
  };

  const selectAccount = (selectedAccount: InjectedAccountWithMeta) => {
    setAccount(selectedAccount);
  };

  if (!account) {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-lg border border-pink-200">
        <div className="text-center">
          <Wallet className="mx-auto h-12 w-12 text-pink-600 mb-4"/>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Connect Wallet</h2>
          <p className="text-slate-600 mb-6">
            Connect your Polkadot.js extension to interact with the IABS token contract.
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
              <AlertCircle className="text-red-500 mt-0.5 flex-shrink-0" size={20}/>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <button
            onClick={connectWallet}
            disabled={isLoading}
            className="bg-pink-600 hover:bg-pink-700 disabled:bg-pink-300 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            {isLoading ? 'Connecting...' : 'Connect Polkadot.js'}
          </button>

          <div className="mt-6 text-sm text-slate-500">
            <p>Don't have Polkadot.js extension?</p>
            <a
              href="https://polkadot.js.org/extension/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-pink-600 hover:text-pink-700 underline"
            >
              Install it here
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-8 shadow-lg border border-pink-200">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Wallet Connected</h2>
        <button
          onClick={disconnect}
          className="flex items-center space-x-2 text-slate-600 hover:text-slate-800 transition-colors"
        >
          <LogOut size={20}/>
          <span>Disconnect</span>
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Select Account
          </label>
          <select
            value={account.address}
            onChange={(e) => {
              const selectedAccount = accounts.find(acc => acc.address === e.target.value);
              if (selectedAccount) selectAccount(selectedAccount);
            }}
            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          >
            {accounts.map((acc) => (
              <option key={acc.address} value={acc.address}>
                {acc.meta.name} ({acc.address.slice(0, 8)}...{acc.address.slice(-8)})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-50 p-4 rounded-lg">
            <div className="text-sm text-slate-600">Account Name</div>
            <div className="font-semibold text-slate-900">{account.meta.name}</div>
          </div>
          <div className="bg-slate-50 p-4 rounded-lg">
            <div className="text-sm text-slate-600">Balance</div>
            <div className="font-semibold text-slate-900">{balance}</div>
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-lg">
          <div className="text-sm text-slate-600">Address</div>
          <div className="font-mono text-sm text-slate-900 break-all">{account.address}</div>
        </div>
      </div>
    </div>
  );
}
