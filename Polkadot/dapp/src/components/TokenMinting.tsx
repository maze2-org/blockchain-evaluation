import {u8aToHex} from '@polkadot/util';
import {ApiPromise} from '@polkadot/api';
import {decodeAddress} from "@polkadot/util-crypto";
import {web3FromAddress} from '@polkadot/extension-dapp';
import {BN, formatBalance} from '@polkadot/util';
import {useState, useEffect} from 'react';
import {InjectedAccountWithMeta} from '@polkadot/extension-inject/types';
import {Coins, Download, AlertCircle, CheckCircle, Loader} from 'lucide-react';

import useContract from '../hooks/useContract';
import {WS_NETWORK} from "../constants";

interface TokenMintingProps {
  account: InjectedAccountWithMeta;
  api: ApiPromise;
}

export default function TokenMinting({account, api}: TokenMintingProps) {
  const [isMinting, setIsMinting] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [tokenBalance, setTokenBalance] = useState<string>('0');
  const [isOwner, setIsOwner] = useState(false);
  const [contractBalance, setContractBalance] = useState<string>('0');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [minPayment, setMinPayment] = useState<BN | null>(null);
  const [humanMinPayment, setHumanMinPayment] = useState<string | null>(null);

  const {contract, contractAddress} = useContract(api);

  useEffect(() => {
    if (contract && account) {
      fetchMinPayment();
      fetchTokenBalance();
      checkOwnership();
      fetchContractBalance();
    }
  }, [contract, account]);

  const fetchMinPayment = async () => {
    if (!contract || !account) return;
    try {
      const {gasRequired} = await contract.query.minPayment(account.address, {
        gasLimit: api.registry.createType('WeightV2', {refTime: 100_000_000_000, proofSize: 1_000_000}) as any
      });
      const response = await contract.query.minPayment(
        account.address,
        {gasLimit: gasRequired}
      );
      if (response.result && response.result.isOk && response.output) {
        const result: any = response.output?.toJSON() || {ok: '0x0'};
        const bnValue = new BN(result.ok.replace(/^0x/, ''), 16);

        setMinPayment(bnValue);
        const formattedBalance = formatBalance(bnValue, {
          withZero: false,
          withUnit: 'SBY',
          forceUnit: 'SBY',
          decimals: api.registry.chainDecimals[0],
        });
        setHumanMinPayment(formattedBalance)
      } else {
        setMinPayment(null);
      }
    } catch (error) {
      console.error('Error fetching minPayment:', error);
      setMinPayment(null);
    }
  };

  const fetchTokenBalance = async () => {
    if (!contract || !account) return;
    try {
      const {gasRequired} = await contract.query.balanceOf(
        account.address,
        {gasLimit: api.registry.createType('WeightV2', {refTime: 100_000_000_000, proofSize: 1_000_000}) as any},
        account.address
      );
      const response = await contract.query.balanceOf(
        account.address,
        {gasLimit: gasRequired},
        account.address
      );
      if (response.result && response.result.isOk && response.output) {
        const result: any = response.output?.toJSON() || {ok: '0x0'};
        const bnValue = new BN(result.ok.replace(/^0x/, ''), 16);

        const formattedBalance = formatBalance(bnValue, {
          withZero: false,
          withUnit: 'IABS',
          forceUnit: 'IABS',
          decimals: api.registry.chainDecimals[0],
        });
        setTokenBalance(formattedBalance);
      } else if (response.result && response.result.isErr) {
        setMessage({type: 'error', text: `Contract call error: ${response.result.asErr.toString()}`});
      }
    } catch (error) {
      setMessage({type: 'error', text: 'Failed to fetch token balance. Please try again.'});
    }
  };

  const checkOwnership = async () => {
    if (!contract || !account) return;

    try {
      const {gasRequired} = await contract.query.owner(account.address, {
        gasLimit: api.registry.createType('WeightV2', {
          refTime: 100_000_000_000,
          proofSize: 1_000_000
        }) as any
      });

      const response = await contract.query.owner(account.address, {
        gasLimit: gasRequired
      });

      if (response.result?.isOk && response.output) {
        const result: any = response.output.toJSON();
        const ownerAddress = result.ok;

        // Decode addresses to get the same format
        const ownerPubKey = decodeAddress(ownerAddress);
        const accountPubKey = decodeAddress(account.address);

        // Compare hex values of public keys
        const isSame = u8aToHex(ownerPubKey) === u8aToHex(accountPubKey);

        setIsOwner(isSame);
      }
    } catch (error) {
      console.error('Error checking ownership:', error);
    }
  };

  const fetchContractBalance = async () => {
    if (!contract || !account) return;
    try {
      const {gasRequired} = await contract.query.contractBalance(account.address, {
        gasLimit: api.registry.createType('WeightV2', {refTime: 100_000_000_000, proofSize: 1_000_000}) as any
      });
      const response = await contract.query.contractBalance(
        account.address,
        {gasLimit: gasRequired}
      );
      if (response.result && response.result.isOk && response.output) {
        const result: any = response.output?.toJSON() || {ok: '0x0'};
        const bnValue = new BN(result.ok.replace(/^0x/, ''), 16);

        const formattedBalance = formatBalance(bnValue, {
          withZero: false,
          withUnit: 'SBY',
          forceUnit: 'SBY',
          decimals: api.registry.chainDecimals[0],
        });
        setContractBalance(formattedBalance)
      }
    } catch (error) {
      console.error('Error fetching contract balance:', error);
    }
  };

  const mintTokens = async () => {
    if (!contract || !account || !minPayment) return;

    setIsMinting(true);
    setMessage(null);

    try {
      const injector = await web3FromAddress(account.address);

      const {gasRequired, storageDeposit} = await contract.query.mint(account.address, {
        value: minPayment,
        gasLimit: api.registry.createType('WeightV2', {refTime: 100_000_000_000, proofSize: 1_000_000}) as any
      });

      const tx = contract.tx.mint({
        value: minPayment,
        gasLimit: gasRequired,
        storageDepositLimit: storageDeposit.isCharge ? storageDeposit.asCharge : null,
      });

      const unsub = await tx.signAndSend(account.address, {signer: injector.signer}, (result) => {
        console.log('Transaction status:', result.status.type);

        if (result.status.isInBlock) {
          setMessage({type: 'success', text: 'Transaction in block...'});
        } else if (result.status.isFinalized) {
          const contractEvents = result.events.filter(({event}) =>
            api.events.contracts.ContractEmitted.is(event)
          );

          if (contractEvents.length > 0) {
            setMessage({type: 'success', text: 'Minted 1,000 IABS tokens!'});
          } else {
            setMessage({type: 'success', text: 'Transaction finalized. Check your balance.'});
          }

          fetchTokenBalance();
          fetchContractBalance();
          unsub();
        } else if (result.dispatchError) {
          let errorMessage = 'Transaction failed';

          if (result.dispatchError.isModule) {
            const decoded = api.registry.findMetaError(result.dispatchError.asModule);
            errorMessage = `${decoded.section}.${decoded.name}: ${decoded.docs.join(' ')}`;
          } else {
            errorMessage = result.dispatchError.toString();
          }

          setMessage({type: 'error', text: errorMessage});
          console.error('Dispatch error:', errorMessage);
          unsub();
        }
      });
    } catch (error: any) {
      console.error('Error minting tokens:', error);
      setMessage({type: 'error', text: 'Minting failed: ' + error.message});
    } finally {
      setIsMinting(false);
    }
  };

  const withdrawFunds = async () => {
    if (!contract || !account || !isOwner) return;

    setIsWithdrawing(true);
    setMessage(null);

    try {
      const injector = await web3FromAddress(account.address);

      const gasLimit = new BN('1000000000000');

      const tx = contract.tx.withdraw({
        gasLimit: gasLimit,
        storageDepositLimit: null
      });

      const unsub = await tx.signAndSend(account.address, {signer: injector.signer}, (result) => {
        if (result.status.isInBlock) {
          console.log('Withdraw transaction in block');
        } else if (result.status.isFinalized) {
          setMessage({type: 'success', text: 'Successfully withdrew contract funds!'});
          fetchContractBalance();
          unsub();
        } else if (result.dispatchError) {
          let errorMessage = 'Withdraw failed';

          if (result.dispatchError.isModule) {
            const decoded = api.registry.findMetaError(result.dispatchError.asModule);
            errorMessage = `${decoded.section}.${decoded.name}: ${decoded.docs.join(' ')}`;
          }

          setMessage({type: 'error', text: errorMessage});
          unsub();
        }
      });
    } catch (error: any) {
      console.error('Error withdrawing funds:', error);
      setMessage({type: 'error', text: 'Failed to withdraw funds. Please ensure you are the contract owner.'});
    } finally {
      setIsWithdrawing(false);
    }
  };

  if (!contract) {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-lg border border-pink-200">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4"/>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Contract Not Available</h2>
          <p className="text-slate-600">
            The IABS token contract is not deployed or not accessible.
            Please ensure the contract is deployed to the connected network.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-8 shadow-lg border border-pink-200">
        <div className="flex items-center space-x-3 mb-6">
          <Coins className="h-8 w-8 text-pink-600"/>
          <h2 className="text-2xl font-bold text-slate-900">IABS Token Balance</h2>
        </div>

        <div className="text-center">
          <div className="text-4xl font-bold text-pink-600 mb-2">
            {tokenBalance}
          </div>
          <p className="text-slate-600">Your current token balance</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-8 shadow-lg border border-pink-200">
        <h3 className="text-xl font-bold text-slate-900 mb-4">Mint IABS Tokens</h3>
        <p className="text-slate-600 mb-6">
          Send 0.01 SBY to mint 1,000 IABS tokens. The tokens will be added to your balance immediately.
        </p>

        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-start space-x-3 ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="text-green-500 mt-0.5 flex-shrink-0" size={20}/>
            ) : (
              <AlertCircle className="text-red-500 mt-0.5 flex-shrink-0" size={20}/>
            )}
            <p className={`text-sm ${
              message.type === 'success' ? 'text-green-700' : 'text-red-700'
            }`}>
              {message.text}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-50 p-4 rounded-lg">
            <div className="text-sm text-slate-600">Required Payment</div>
            <div className="font-semibold text-slate-900">
              {humanMinPayment ? `${humanMinPayment}` : '...'}
            </div>
          </div>
          <div className="bg-slate-50 p-4 rounded-lg">
            <div className="text-sm text-slate-600">Tokens to Mint</div>
            <div className="font-semibold text-slate-900">1,000 IABS</div>
          </div>
        </div>

        <button
          onClick={mintTokens}
          disabled={isMinting}
          className="w-full bg-pink-600 hover:bg-pink-700 disabled:bg-pink-300 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
        >
          {isMinting ? (
            <>
              <Loader className="animate-spin" size={20}/>
              <span>Minting...</span>
            </>
          ) : (
            <>
              <Coins size={20}/>
              <span>Mint 1,000 IABS</span>
            </>
          )}
        </button>
      </div>

      {isOwner && (
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-green-200">
          <div className="flex items-center space-x-3 mb-6">
            <Download className="h-8 w-8 text-green-600"/>
            <h3 className="text-xl font-bold text-slate-900">Admin Withdraw</h3>
          </div>

          <p className="text-slate-600 mb-6">
            As the contract owner, you can withdraw the SBY collected from token minting.
          </p>

          <div className="bg-slate-50 p-4 rounded-lg mb-6">
            <div className="text-sm text-slate-600">Contract Balance</div>
            <div className="font-semibold text-slate-900">{contractBalance}</div>
          </div>

          <button
            onClick={withdrawFunds}
            disabled={isWithdrawing}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            {isWithdrawing ? (
              <>
                <Loader className="animate-spin" size={20}/>
                <span>Withdrawing...</span>
              </>
            ) : (
              <>
                <Download size={20}/>
                <span>Withdraw Funds</span>
              </>
            )}
          </button>
        </div>
      )}

      <div className="bg-slate-50 rounded-lg p-6">
        <h4 className="font-semibold text-slate-900 mb-2">Contract Information</h4>
        <div className="text-sm text-slate-600 space-y-1">
          <div>Contract Address: <span className="font-mono font-bold">{contractAddress}</span></div>
          <div>Network: Shibuya Testnet <span className={'font-mono font-bold'}>({WS_NETWORK})</span></div>
        </div>
      </div>
    </div>
  );
}
