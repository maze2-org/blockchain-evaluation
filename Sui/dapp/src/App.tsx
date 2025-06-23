import { useEffect, useState } from 'react';
import { WalletProvider } from '@suiet/wallet-kit';
import WalletConnection from './components/WalletConnection';
import TokenMinting from './components/TokenMinting';
import { SuiClient } from '@mysten/sui/client';
import iabsImage from '../src/assets/iabs.jpg'
import {NETWORK, RPC_URL} from "./config/config.ts";

function App() {
  const [suiClient, setSuiClient] = useState<SuiClient | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string>('');

  useEffect(() => {
    const initializeSuiClient = async () => {
      try {
        setIsConnecting(true);
        setConnectionError('');

        const client = new SuiClient({
          url: RPC_URL,
        });

        await client.getLatestSuiSystemState();

        setSuiClient(client);
        console.log(`Connected to Sui ${NETWORK}`);
      } catch (error) {
        console.error('Failed to connect to Sui network:', error);
        setConnectionError(
          `Failed to connect to Sui ${NETWORK}. Please check your internet connection.`
        );
      } finally {
        setIsConnecting(false);
      }
    };

    initializeSuiClient();
  }, []);

  return (
    <WalletProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100">
        <div className="container mx-auto px-4 py-8">
          <header className="text-center mb-12">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-12 h-12 flex items-center justify-center">
                <img src={iabsImage} className="rounded-xl" alt="iabs"/>
              </div>
              <h1 className="text-4xl font-bold text-slate-900">IABS Token</h1>
            </div>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Mint IABS tokens on Sui! Send 0.01 SUI to receive 1,000 IABS
              tokens. Built with Move smart contracts on Sui's object-centric
              blockchain.
            </p>

            {isConnecting && (
              <div className="mt-4 text-amber-600">
                Connecting to Sui {NETWORK}...
              </div>
            )}

            {connectionError && (
              <div className="mt-4 text-red-600">{connectionError}</div>
            )}

            {suiClient && (
              <div className="mt-4 text-green-600">
                Connected to Sui {NETWORK}
              </div>
            )}
          </header>

          <div className="max-w-2xl mx-auto space-y-8">
            <WalletConnection suiClient={suiClient} />

            {suiClient && <TokenMinting suiClient={suiClient} />}
          </div>

          <footer className="mt-16 text-center text-slate-500">
            <p>
              Part of the MAZE2 blockchain developer experience evaluation.{' '}
              <a
                href="https://github.com/maze2-org/blockchain-evaluation"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-600 hover:text-cyan-700"
              >
                View on GitHub
              </a>
            </p>
          </footer>
        </div>
      </div>
    </WalletProvider>
  );
}

export default App;
