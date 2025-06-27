import {useWallet} from '@aptos-labs/wallet-adapter-react';
import React, {useState, useEffect, useMemo} from 'react';
import {Aptos, AptosConfig, Network} from '@aptos-labs/ts-sdk';

import {AccountBalance, ContractData} from "./types.ts";
import {APP_CONFIG, CONTRACT_FUNCTIONS} from './constants';
import {convertAptToOcta, formatAPTAmount} from './helpers'

const App: React.FC = () => {
  const {account, connected, disconnect, connect, wallets, signAndSubmitTransaction} = useWallet();

  const [mintingLoading, setMintingLoading] = useState(false);
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [contractStatus, setContractStatus] = useState<'connecting' | 'valid' | 'invalid'>('connecting');
  const [accountBalance, setAccountBalance] = useState<AccountBalance>({apt: '0'});
  const [contractData, setContractData] = useState<ContractData>({
    owner: '',
    totalSupply: '0',
    contractBalance: '0',
  });

  const config = new AptosConfig({network: Network.TESTNET});
  const aptos = new Aptos(config);

  const connectWallet = async () => {
    const petraWallet = wallets.find((wallet: any) => wallet.name === 'Petra');
    if (petraWallet) {
      connect(petraWallet.name);
    }
  }

  const fetchAccountBalance = async () => {
    if (!connected || !account) return;

    try {
      const aptBalance = await aptos.getAccountAPTAmount({
        accountAddress: account.address.toString()
      });

      setAccountBalance({apt: formatAPTAmount(aptBalance)});
    } catch (error) {
      console.error('Error fetching account balance:', error);
    }
  };

  const fetchContractData = async () => {
    if (!connected || !account) return;

    setContractStatus('connecting');

    try {
      let totalSupply = '0';
      try {
        const totalSupplyResponse = await aptos.view({
          payload: {function: CONTRACT_FUNCTIONS.GET_TOTAL_SUPPLY}
        });
        const resultInOctas = parseInt(totalSupplyResponse[0] as string);
        const resultInApts = resultInOctas / Math.pow(10, 8);
        totalSupply = formatAPTAmount(resultInApts)
      } catch (error) {
        console.log('Could not fetch contract total supply:', error);
      }

      let contractBalance = '0';
      try {
        const contractBalanceResponse = await aptos.view({
          payload: {function: CONTRACT_FUNCTIONS.GET_CONTRACT_BALANCE}
        });
        const resultInOctas = parseInt(contractBalanceResponse[0] as string);
        const resultInApts = resultInOctas / Math.pow(10, 8);
        contractBalance = formatAPTAmount(resultInApts)
      } catch (error) {
        console.log('Could not fetch contract balance:', error);
      }

      let owner = '';
      try {
        const contractOwnerResponse = await aptos.view({
          payload: {function: CONTRACT_FUNCTIONS.GET_OWNER}
        });
        owner = contractOwnerResponse[0] as string
      } catch (error) {
        console.log('Could not fetch contract owner:', error);
      }

      setContractData({
        owner,
        totalSupply,
        contractBalance,
      });
      setContractStatus('valid');
    } catch (error) {
      console.error('Error fetching contract data:', error);
      setContractStatus('invalid');
    }
  };

  const mintTokens = async () => {
    if (!connected || !account || !signAndSubmitTransaction) return;

    setMintingLoading(true);
    try {
      const transaction = {
        data: {
          function: CONTRACT_FUNCTIONS.MINT,
          functionArguments: [APP_CONFIG.MINT_APT_AMOUNT_OCTAS.toString()],
        }
      };

      const response = await signAndSubmitTransaction(transaction);

      await aptos.waitForTransaction({
        transactionHash: response.hash
      });

      await Promise.all([fetchContractData(), fetchAccountBalance()]);
    } catch (error) {
      console.log('Mint error:', error);
    } finally {
      setMintingLoading(false);
    }
  };

  const withdrawFunds = async () => {
    if (!connected || !account || !withdrawAmount) return;

    setWithdrawLoading(true);
    try {
      const withdrawAmountOctas = Math.floor(convertAptToOcta(parseFloat(withdrawAmount)));
      const transaction = {
        data: {
          function: CONTRACT_FUNCTIONS.WITHDRAW,
          functionArguments: [withdrawAmountOctas.toString()],
        }
      };

      const response = await signAndSubmitTransaction(transaction);

      await aptos.waitForTransaction({
        transactionHash: response.hash
      });

      await Promise.all([fetchContractData(), fetchAccountBalance()]);
    } catch (error) {
      console.log('Withdraw error:', error);
    } finally {
      setWithdrawLoading(false);
    }
  };

  useEffect(() => {
    if (connected) {
      Promise.all([fetchContractData(), fetchAccountBalance()]);
    }
  }, [connected, account]);

  const contractStatusColor = useMemo(() => {
    switch (contractStatus) {
      case 'connecting':
        return 'text-yellow-400';
      case 'valid':
        return 'text-green-400';
      case 'invalid':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  }, [contractStatus]);

  const contractStatusText = useMemo(() => {
    switch (contractStatus) {
      case 'connecting':
        return 'Connecting to contract...';
      case 'valid':
        return 'Contract connected successfully';
      case 'invalid':
        return 'Contract connection failed';
      default:
        return 'Unknown status';
    }
  }, [contractStatus]);

  const isOwner = connected && account && account.address?.toString() === contractData.owner;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-black to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">{APP_CONFIG.TOKEN_NAME} Token dApp</h1>

          <p className="text-gray-300">Mint {APP_CONFIG.TOKEN_NAME} tokens with APT using Petra wallet on
            Aptos {APP_CONFIG.NETWORK}
          </p>

          <div className="mt-4 flex justify-center items-center space-x-2">
            <div
              className={`w-3 h-3 rounded-full ${contractStatus === 'connecting' ? 'bg-yellow-400' : contractStatus === 'valid' ? 'bg-green-400' : 'bg-red-400'}`}></div>
            <span className={`text-sm ${contractStatusColor}`}>
              {contractStatusText}
            </span>
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="bg-gray-800/50 backdrop-blur-md rounded-xl border border-gray-700 p-6 mb-6">
            <h2 className="text-xl font-semibold text-white mb-4">Wallet Connection</h2>
            {!connected ? (
              <div className="space-y-4">
                <p className="text-gray-300">Connect your Petra wallet to get started</p>
                <button
                  onClick={connectWallet}
                  className="w-full py-3 px-4 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <span>Connect Petra Wallet</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-400 font-medium">✅ Wallet Connected</p>
                    <p className="text-gray-300 text-sm font-mono">
                      {account?.address?.toString().slice(0, 6)}...{account?.address?.toString().slice(-4)}
                    </p>
                  </div>
                  <button
                    onClick={disconnect}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            )}
          </div>

          {connected && (
            <>
              <div className="bg-gray-800/50 backdrop-blur-md rounded-xl border border-gray-700 p-6 mb-6">
                <h2 className="text-xl font-semibold text-white mb-4">Your Account Balance</h2>
                <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600">
                  <p className="text-gray-300 text-sm">APT Balance</p>
                  <p className="text-white text-2xl font-bold">{accountBalance.apt} APT</p>
                </div>
              </div>

              <div className="bg-gray-800/50 backdrop-blur-md rounded-xl border border-gray-700 p-6 mb-6">
                <h2 className="text-xl font-semibold text-white mb-4">Contract Statistics</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600">
                    <p className="text-gray-300 text-sm">Total {APP_CONFIG.TOKEN_NAME} Supply</p>
                    <p
                      className="text-white text-2xl font-bold">{contractData.totalSupply} {APP_CONFIG.TOKEN_NAME}</p>
                  </div>
                  <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600">
                    <p className="text-gray-300 text-sm">Contract APT Balance</p>
                    <p
                      className="text-white text-2xl font-bold">{contractData.contractBalance} APT</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800/50 backdrop-blur-md rounded-xl border border-gray-700 p-6 mb-6">
                <h2 className="text-xl font-semibold text-white mb-4">Mint {APP_CONFIG.TOKEN_NAME} Tokens</h2>
                <div className="space-y-4">
                  <button
                    onClick={mintTokens}
                    disabled={mintingLoading}
                    className="w-full py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                  >
                    {mintingLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Minting...</span>
                      </div>
                    ) : (
                      `Mint ${APP_CONFIG.EXCHANGE_RATE.APT_TO_IABS} ${APP_CONFIG.TOKEN_NAME} for ${APP_CONFIG.EXCHANGE_RATE.APT_AMOUNT} APT`
                    )}
                  </button>
                </div>
              </div>

              {isOwner && (
                <div className="bg-amber-500/10 backdrop-blur-md rounded-xl border border-amber-500/30 p-6 mb-6">
                  <h2 className="text-xl font-semibold text-white mb-4">Owner Functions</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-300 text-sm mb-2">
                        Withdraw Amount (APT)
                      </label>
                      <input
                        type="number"
                        step="0.00000001"
                        min="0"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700/50 text-white rounded-lg border border-gray-600 focus:border-amber-400 focus:outline-none"
                        placeholder="Enter APT amount to withdraw"
                      />
                    </div>
                    <button
                      onClick={withdrawFunds}
                      disabled={withdrawLoading || !withdrawAmount}
                      className="w-full py-3 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {withdrawLoading ? 'Withdrawing...' : 'Withdraw APT'}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="max-w-2xl mx-auto mt-8">
          <div className="bg-gray-800/30 backdrop-blur-md rounded-xl border border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Contract Information</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-300 text-sm">Contract Address:</span>
                <span className="text-white font-mono text-sm">{APP_CONFIG.CONTRACT_ADDRESS}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300 text-sm">Network:</span>
                <span className="text-white text-sm">Aptos {APP_CONFIG.NETWORK}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300 text-sm">Token Symbol:</span>
                <span className="text-white text-sm">{APP_CONFIG.TOKEN_SYMBOL}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300 text-sm">Token Decimals:</span>
                <span className="text-white text-sm">8</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300 text-sm">Contract Status:</span>
                <span className={`text-sm font-medium ${contractStatusColor}`}>
                  {contractStatus === 'connecting' ? 'Connecting...' : contractStatus === 'valid' ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-12 text-gray-400">
          <p className="mb-2">Built on Aptos {APP_CONFIG.NETWORK}</p>
          <div className="flex justify-center space-x-4 text-sm">
            <a
              href={`${APP_CONFIG.EXPLORER_BASE_URL}/?network=${APP_CONFIG.NETWORK}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              Explorer
            </a>
            <a
              href={APP_CONFIG.APTOS_FAUCET_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              Faucet
            </a>
            <a
              href="https://petra.app"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              Get Petra Wallet
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
