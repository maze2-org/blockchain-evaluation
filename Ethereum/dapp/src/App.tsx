import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { MintButton } from './components/MainButton.component';
import { TokenBalance } from './components/TokenBalance.component';
import { WithdrawButton } from './components/WithdrawButton.component';

export default function App() {
  const { isConnected } = useAccount();

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>IABS DApp</h1>
      <ConnectButton />

      {isConnected && (
        <div style={{ marginTop: '2rem' }}>
          <TokenBalance />
          <MintButton />
          <WithdrawButton />
        </div>
      )}
    </div>
  );
}
