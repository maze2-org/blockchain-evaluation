import { useState, useEffect } from 'react';
import { useWallet } from '@suiet/wallet-kit';
import { SuiClient } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import {
  Coins,
  Loader,
  Download,
  HandCoins,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import useContract from '../hooks/useContract';
import {MINT_AMOUNT, MINT_PRICE, NETWORK} from "../config/config.ts";

interface TokenMintingProps {
  suiClient: SuiClient;
}

export default function TokenMinting({ suiClient }: TokenMintingProps) {
  const { connected, account, signAndExecuteTransaction } = useWallet();
  const [isMinting, setIsMinting] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [tokenBalance, setTokenBalance] = useState<number>(0);
  const [isOwner, setIsOwner] = useState(false);
  const [contractBalance, setContractBalance] = useState<string>('0');
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const { contractAddress, packageId } = useContract();

  useEffect(() => {
    if (connected && account && suiClient && contractAddress) {
      fetchTokenBalance();
      checkOwnership();
      fetchContractBalance();
    }
  }, [connected, account, suiClient, contractAddress]);

  const fetchTokenBalance = async () => {
    if (!account || !suiClient) return;

    try {
      const ownedObjects = await suiClient.getOwnedObjects({
        owner: account.address,
        filter: {
          StructType: `${packageId}::iabs::IABSBalance`,
        },
        options: {
          showContent: true,
        },
      });

      let totalBalance = 0;
      for (const obj of ownedObjects.data) {
        if (obj.data?.content && 'fields' in obj.data.content) {
          const fields = obj.data.content.fields as any;
          if (fields.balance) {
            totalBalance += parseInt(fields.balance);
          }
        }
      }

      setTokenBalance(totalBalance);
    } catch (error) {
      console.error('Error fetching token balance:', error);
    }
  };

  const checkOwnership = async () => {
    if (!contractAddress || !account || !suiClient) return;

    try {
      const treasuryObject = await suiClient.getObject({
        id: contractAddress,
        options: { showContent: true },
      });

      if (
        treasuryObject.data?.content &&
        'fields' in treasuryObject.data.content
      ) {
        const fields = treasuryObject.data.content.fields as any;
        setIsOwner(fields?.owner === account.address);
      }
    } catch (error) {
      console.error('Error checking ownership:', error);
    }
  };

  const fetchContractBalance = async () => {
    if (!contractAddress || !suiClient) return;

    try {
      const treasuryObject = await suiClient.getObject({
        id: contractAddress,
        options: { showContent: true },
      });

      if (
        treasuryObject.data?.content &&
        'fields' in treasuryObject.data.content
      ) {
        const fields = treasuryObject.data.content.fields as any;
        if (fields.balance) {
          const suiBalance = (parseInt(fields.balance) / 1_000_000_000).toFixed(
            4
          );
          setContractBalance(suiBalance);
        }
      }
    } catch (error) {
      console.error('Error fetching contract balance:', error);
    }
  };

  const mintTokens = async () => {
    if (!account || !suiClient || !contractAddress || !packageId) return;

    setIsMinting(true);
    setMessage(null);

    try {
      const tx = new Transaction();
      const paymentAmount = MINT_PRICE;
      const [paymentCoin] = tx.splitCoins(tx.gas, [paymentAmount]);

      tx.moveCall({
        target: `${packageId}::iabs::mint`,
        arguments: [
          tx.object(contractAddress),
          paymentCoin,
        ],
      });

      const result = await signAndExecuteTransaction({
        transaction: tx,
      });

      if (result && result.effects) {
        setMessage({
          type: 'success',
          text: 'Successfully minted 1,000 IABS tokens!',
        });
        await fetchTokenBalance();
        await fetchContractBalance();
      } else {
        throw new Error('Transaction failed');
      }
    } catch (error) {
      console.error('Error minting tokens:', error);
      setMessage({
        type: 'error',
        text: 'Failed to mint tokens. Please ensure contract is deployed and try again.',
      });
    } finally {
      setIsMinting(false);
    }
  };

  const withdrawFunds = async () => {
    if (!account || !suiClient || !contractAddress || !packageId || !isOwner)
      return;

    setIsWithdrawing(true);
    setMessage(null);

    try {
      const tx = new Transaction();
      tx.moveCall({
        target: `${packageId}::iabs::withdraw`,
        arguments: [tx.object(contractAddress)],
      });

      const result = await signAndExecuteTransaction({
        transaction: tx,
      });

      if (result && result.effects) {
        setMessage({
          type: 'success',
          text: 'Successfully withdrew contract funds!',
        });
        await fetchContractBalance();
      } else {
        throw new Error('Transaction failed');
      }
    } catch (error) {
      console.error('Error withdrawing funds:', error);
      setMessage({
        type: 'error',
        text: 'Failed to withdraw funds. Please try again.',
      });
    } finally {
      setIsWithdrawing(false);
    }
  };

  if (!connected) {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-lg border border-cyan-200">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-amber-500 mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Wallet Required
          </h2>
          <p className="text-slate-600">
            Please connect your Sui wallet to mint IABS tokens.
          </p>
        </div>
      </div>
    );
  }

  if (!contractAddress || contractAddress.includes('PLACEHOLDER')) {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-lg border border-cyan-200">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-amber-500 mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Contract Not Deployed
          </h2>
          <p className="text-slate-600 mb-4">
            The IABS token contract needs to be deployed first.
          </p>
          <div className="bg-slate-100 rounded-lg p-4">
            <p className="text-sm text-slate-700 mb-2">
              To deploy the contract:
            </p>
            <code className="text-xs bg-slate-800 text-green-400 p-2 rounded block">
              Read DEPLOYMENT.md
            </code>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-8 shadow-lg border border-cyan-200">
        <div className="flex items-center space-x-3 mb-6">
          <HandCoins className="h-8 w-8 text-cyan-600" />
          <h2 className="text-2xl font-bold text-slate-900">
            IABS Token Balance
          </h2>
        </div>

        <div className="text-center">
          <div className="text-4xl font-bold text-cyan-600 mb-2">
            {tokenBalance.toLocaleString()} IABS
          </div>
          <p className="text-slate-600">Your current token balance</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-8 shadow-lg border border-cyan-200">
        <h3 className="text-xl font-bold text-slate-900 mb-4">
          Mint IABS Tokens
        </h3>
        <p className="text-slate-600 mb-6">
          Send 0.01 SUI to mint 1,000 IABS tokens. The tokens will be added to
          your balance immediately.
        </p>

        {message && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-start space-x-3 ${
              message.type === 'success'
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle
                className="text-green-500 mt-0.5 flex-shrink-0"
                size={20}
              />
            ) : (
              <AlertCircle
                className="text-red-500 mt-0.5 flex-shrink-0"
                size={20}
              />
            )}
            <p
              className={`text-sm ${
                message.type === 'success' ? 'text-green-700' : 'text-red-700'
              }`}
            >
              {message.text}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-50 p-4 rounded-lg">
            <div className="text-sm text-slate-600">Required Payment</div>
            <div className="font-semibold text-slate-900">0.01 SUI</div>
          </div>
          <div className="bg-slate-50 p-4 rounded-lg">
            <div className="text-sm text-slate-600">Tokens to Mint</div>
            <div className="font-semibold text-slate-900">{MINT_AMOUNT} IABS</div>
          </div>
        </div>

        <button
          onClick={mintTokens}
          disabled={isMinting}
          className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-300 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
        >
          {isMinting ? (
            <>
              <Loader className="animate-spin" size={20} />
              <span>Minting...</span>
            </>
          ) : (
            <>
              <Coins size={20} />
              <span>Mint {MINT_AMOUNT} IABS</span>
            </>
          )}
        </button>
      </div>

      {isOwner && (
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-amber-200">
          <div className="flex items-center space-x-3 mb-6">
            <Download className="h-8 w-8 text-amber-600" />
            <h3 className="text-xl font-bold text-slate-900">Admin Withdraw</h3>
          </div>

          <p className="text-slate-600 mb-6">
            As the contract owner, you can withdraw the SUI collected from token
            minting.
          </p>

          <div className="bg-slate-50 p-4 rounded-lg mb-6">
            <div className="text-sm text-slate-600">Contract Balance</div>
            <div className="font-semibold text-slate-900">
              {contractBalance} SUI
            </div>
          </div>

          <button
            onClick={withdrawFunds}
            disabled={isWithdrawing}
            className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            {isWithdrawing ? (
              <>
                <Loader className="animate-spin" size={20} />
                <span>Withdrawing...</span>
              </>
            ) : (
              <>
                <Download size={20} />
                <span>Withdraw Funds</span>
              </>
            )}
          </button>
        </div>
      )}

      <div className="bg-slate-50 rounded-lg p-6">
        <h4 className="font-semibold text-slate-900 mb-2">
          Contract Information
        </h4>
        <div className="text-sm text-slate-600 space-y-1">
          <div>
            Package ID: <span className="font-mono break-all">{packageId}</span>
          </div>
          <div>
            Treasury Object:{' '}
            <span className="font-mono break-all">{contractAddress}</span>
          </div>
          <div>Network: Sui {NETWORK}</div>
          <div>Language: Move</div>
        </div>
      </div>
    </div>
  );
}
