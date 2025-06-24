import { useState, useEffect } from 'react';
import {CONTRACT_CONFIG} from "../config/config.ts";


interface UseContractReturn {
  packageId: string;
  contractAddress: string;
  isDeployed: boolean;
}

export default function useContract(): UseContractReturn {
  const [isDeployed, setIsDeployed] = useState(false);

  useEffect(() => {
    const hasValidPackageId =
      CONTRACT_CONFIG.packageId !==
      '0x0000000000000000000000000000000000000000000000000000000000000000';
    const hasValidContractAddress =
      CONTRACT_CONFIG.contractAddress !==
      '0x0000000000000000000000000000000000000000000000000000000000000000';

    setIsDeployed(hasValidPackageId && hasValidContractAddress);
  }, []);

  return {
    packageId: CONTRACT_CONFIG.packageId,
    contractAddress: CONTRACT_CONFIG.contractAddress,
    isDeployed,
  };
}
