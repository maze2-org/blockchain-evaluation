import { useWriteContract } from 'wagmi';
import IABS_ABI from '../abis/IABS_ABI.json';

const CONTRACT_ADDRESS = '0xFFbC7A0F639a89bA6914a8D356769853C41AD52B';

export function MintButton() {
    const { writeContract, isPending, isSuccess } = useWriteContract();

    const handleMint = () => {
        console.log('Minting 1,000 IABS...');
        writeContract({
            abi: IABS_ABI,
            address: CONTRACT_ADDRESS as `0x${string}`,
            functionName: 'mint',
            value: BigInt(1e16), // 0.01 ETH
        });
    };

    return (
        <div>
            <button onClick={handleMint} disabled={isPending}>
                {isPending ? 'Minting...' : 'Mint 1,000 IABS'}
            </button>
            {isSuccess && <p>✅ Mint successful</p>}
        </div>
    );
}
