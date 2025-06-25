import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import IABS_ABI from '../abis/IABS_ABI.json';

const CONTRACT_ADDRESS = '0xFFbC7A0F639a89bA6914a8D356769853C41AD52B';

export function WithdrawButton() {
    const { address } = useAccount();

    const { data: owner } = useReadContract({
        abi: IABS_ABI,
        address: CONTRACT_ADDRESS as `0x${string}`,
        functionName: 'owner',
    });

    const { writeContract, isPending, isSuccess } = useWriteContract();


    const isOwner =
        (owner as string)?.toLowerCase() === address?.toLowerCase();

    const handleWithdraw = () => {
        writeContract({
            abi: IABS_ABI,
            address: CONTRACT_ADDRESS as `0x${string}`,
            functionName: 'withdraw',
        });
    };

    if (!isOwner) return null;

    return (
        <div style={{ marginTop: '1rem' }}>
            <button onClick={handleWithdraw} disabled={isPending}>
                {isPending ? 'Withdrawing...' : 'Admin Withdraw'}
            </button>
            {isSuccess && <p>✅ Withdrawal successful</p>}
        </div>
    );
}
