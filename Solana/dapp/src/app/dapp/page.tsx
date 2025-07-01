'use client'

import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { PublicKey, SystemProgram, Transaction, TransactionInstruction } from '@solana/web3.js'
import { TOKEN_PROGRAM_ID } from '@solana/spl-token'
import { AnchorProvider, Program, web3, utils, BN } from '@coral-xyz/anchor'
import idl from '@/idl/iabs_minter.json'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'

const PROGRAM_ID = new PublicKey('Eu8NveMwqqQK8WEUBDSqht6WaoJeZHLYVnWcNHLnU5ks')
const OWNER_PUBKEY = new PublicKey('8JRvQsFosWxtDyKspCKngbPtZCUst2zhmRhtsqygcTAh')

export default function DappPageFullContent() {
    const { connection } = useConnection()
    const { publicKey, sendTransaction } = useWallet()
    const [provider, setProvider] = useState<AnchorProvider | null>(null)
    const [program, setProgram] = useState<Program | null>(null)

    useEffect(() => {
        if (publicKey) {
            const anchorProvider = new AnchorProvider(connection, window.solana, {
                commitment: 'processed',
            })
            setProvider(anchorProvider)
            const program = new Program(idl as any, PROGRAM_ID, anchorProvider)
            setProgram(program)
        }
    }, [connection, publicKey])

    const handleMint = async () => {
        if (!program || !publicKey || !provider) return

        const [vaultPDA] = PublicKey.findProgramAddressSync(
            [Buffer.from('vault')],
            program.programId
        )

        const [mintAuthorityPDA] = PublicKey.findProgramAddressSync(
            [Buffer.from('authority')],
            program.programId
        )

        // À remplacer avec vos adresses concrètes
        const mint = new PublicKey('4nmWaHgGgZho8YJhzcUsJxab3QErrX8Rm15MdxWu5r5z')
        const tokenAccount = new PublicKey('En1dKBdhkDfspVFsmJ64H8w54QYvKy3ToYUqG1sZBWh')

        console.log({
            payer: publicKey?.toBase58(),
            mint: mint?.toBase58?.(),
            tokenAccount: tokenAccount?.toBase58?.(),
            mintAuthority: mintAuthorityPDA?.toBase58?.(),
            vault: vaultPDA?.toBase58?.(),
        })

        const sig = await program.methods
            .mint()
            .accounts({
                payer: publicKey,
                mint,
                tokenAccount,
                mintAuthority: mintAuthorityPDA,
                vault: vaultPDA,
                tokenProgram: TOKEN_PROGRAM_ID,
                systemProgram: SystemProgram.programId,
            })
            .rpc()
        console.log('mint signature', sig)
    }

    const handleWithdraw = async () => {
        if (!program || !publicKey || !provider) return

        const [vaultPDA] = PublicKey.findProgramAddressSync(
            [Buffer.from('vault')],
            program.programId
        )

        const tx = await program.methods.withdraw().accounts({
            owner: publicKey,
            vault: vaultPDA,
        }).transaction()

        const sig = await sendTransaction(tx, connection)
        console.log('withdraw signature', sig)
    }

    if (!publicKey) {
        return <div className="text-center mt-4">Connect your wallet to continue.</div>
    }

    const isOwner = publicKey.toBase58() === OWNER_PUBKEY.toBase58()

    return (
        <div className="space-y-4">
            <h1 className="text-xl font-bold">IABS Minter DApp</h1>
            <Button onClick={handleMint}>Mint 1000 IABS (0.01 SOL)</Button>
            {isOwner && (
                <Button variant="outline" onClick={handleWithdraw}>
                    Withdraw Vault Balance
                </Button>
            )}
        </div>
    )
}
