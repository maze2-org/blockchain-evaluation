import { useReadContract, useAccount } from 'wagmi';
import IABS_ABI from '../abis/IABS_ABI.json';

const CONTRACT_ADDRESS = '0xFFbC7A0F639a89bA6914a8D356769853C41AD52B';

export function TokenBalance() {
    const { address } = useAccount();

    const { data, isLoading } = useReadContract({
        abi: IABS_ABI,
        address: CONTRACT_ADDRESS as `0x${string}`,
        functionName: 'balanceOf',
        args: [address],
    });

    const formattedBalance = data
        ? ((data as bigint) / BigInt(1e18)).toString()
        : '0';

    return (
        <p>
            {isLoading
                ? 'Loading balance...'
                : `Your IABS balance: ${formattedBalance}`}
        </p>
    );
}
