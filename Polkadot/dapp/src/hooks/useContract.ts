import {ApiPromise} from '@polkadot/api';
import {ContractPromise} from '@polkadot/api-contract';
import {useState, useEffect} from 'react';

import CONTRACT_ABI from '../abi/iabs_token.json';

const DEFAULT_CONTRACT_ADDRESS = '5DiM11EBXcTmA9D6Zt2UA7bEcX4et2vVLLGrz3eWSSjFXiKS';

interface UseContractReturn {
  contract: ContractPromise | null;
  contractAddress: string;
  isLoading: boolean;
  error: string | null;
}

export default function useContract(api: ApiPromise | null): UseContractReturn {
  const [contract, setContract] = useState<ContractPromise | null>(null);
  const [contractAddress] = useState<string>(DEFAULT_CONTRACT_ADDRESS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!api) {
      setContract(null);
      return;
    }

    const initializeContract = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const contractInstance = new ContractPromise(api, CONTRACT_ABI, contractAddress);

        try {
          const {gasRequired} = await contractInstance.query.totalSupply(contractAddress, {
            gasLimit: api.registry.createType('WeightV2', {refTime: 100_000_000_000, proofSize: 1_000_000}) as any
          });
          const response = await contractInstance.query.totalSupply(
            contractAddress,
            {
              gasLimit: gasRequired,
              storageDepositLimit: null,
            }
          );
          console.log('Contract verified successfully', response.result.toJSON());
        } catch (verifyError) {
          console.warn('Contract verification failed, but continuing:', verifyError);
        }

        setContract(contractInstance);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to initialize contract';
        setError(errorMessage);
        console.error('Contract initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initializeContract();
  }, [api, contractAddress]);

  return {
    contract,
    contractAddress,
    isLoading,
    error
  };
}
