import {useEffect, useState} from 'react';
import {ApiPromise, WsProvider} from '@polkadot/api';
import {InjectedAccountWithMeta} from '@polkadot/extension-inject/types';

import TokenMinting from './components/TokenMinting';
import WalletConnection from './components/WalletConnection';
import {WS_NETWORK} from "./constants";

function App() {
  const [api, setApi] = useState<ApiPromise | null>(null);
  const [account, setAccount] = useState<InjectedAccountWithMeta | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const connectToNode = async () => {
    try {
      setIsConnecting(true);

      const wsProvider = new WsProvider(WS_NETWORK, 1000, {}, 30000);
      wsProvider.on('connected', () => console.log('WebSocket connected to Shibuya'));
      wsProvider.on('disconnected', () => console.log('WebSocket disconnected'));
      wsProvider.on('error', () => {
      });

      const api = await ApiPromise.create({
        provider: wsProvider,
        throwOnConnect: true,
        throwOnUnknown: false,
      });

      await api.isReady;
      setApi(api);
      console.log('Successfully connected to Shibuya testnet');
    } catch (error: any) {
      console.error('Connection failed:', error?.message || 'Unknown error');
      setApi(null);
    } finally {
      setIsConnecting(false);
    }
  };

  useEffect(() => {
    connectToNode();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-100">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <h1 className="text-4xl font-bold text-pink-600">IABS Token</h1>
          </div>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Mint IABS tokens on Shibuya testnet! Send 0.01 SBY to receive 1,000 IABS tokens.
          </p>
          <p className="text-lg font-bold text-pink-600">Smart contracts on Astar Network.</p>

          {isConnecting && (
            <div className="mt-4 text-amber-600">
              Connecting to Shibuya testnet...
            </div>
          )}

          {!api && !isConnecting && (
            <div className="mt-4 text-red-600">
              Failed to connect to Shibuya testnet. Please check your internet connection.
            </div>
          )}
        </header>

        <div className="max-w-2xl mx-auto space-y-8">
          <WalletConnection
            account={account}
            setAccount={setAccount}
            api={api}
          />

          {account && api && (
            <TokenMinting
              account={account}
              api={api}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
