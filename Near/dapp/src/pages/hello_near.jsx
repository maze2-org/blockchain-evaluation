import { useEffect, useState } from 'react';
import styles from '@/styles/app.module.css';
import { HelloNearContract } from '@/config';
import { useWalletSelector } from '@near-wallet-selector/react-hook';
import { utils } from 'near-api-js';

const CONTRACT = HelloNearContract;

export default function HelloNear() {
  const { signedAccountId, viewFunction, callFunction } = useWalletSelector();

  const [owner, setOwner] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    if (!signedAccountId) return;

    viewFunction({ contractId: CONTRACT, method: 'get_owner' })
      .then((ownerId) => {
        setOwner(ownerId);
        setIsOwner(ownerId === signedAccountId);
      })
      .catch(err => {
        console.log("ERROR!!", err)
      })
  }, [signedAccountId]);

  console.log({ signedAccountId, owner })

  const mint = async () => {
    setStatus('Minting...');
    try {
      await callFunction({
        contractId: CONTRACT,
        method: 'mint',
        args: {},
        gas: '100000000000000',
        deposit: utils.format.parseNearAmount('0.01'),
      });
      setStatus('Mint successful!');
    } catch (e) {
      setStatus(`Mint failed: ${e.message || e}`);
    }
  };

  const withdraw = async () => {
    setStatus('Withdrawing...');
    try {
      await callFunction({
        contractId: CONTRACT,
        method: 'withdraw',
        args: {},
        gas: '100000000000000',
      });
      setStatus('Withdraw successful!');
    } catch (e) {
      setStatus(`Withdraw failed: ${e.message || e}`);
    }
  };

  return (
    <main className={styles.main}>
      <h1>Token Contract</h1>
      <p>Contract: <code>{CONTRACT}</code></p>
      <p>Status: {status}</p>

      {signedAccountId ? (
        <>
          <button onClick={mint}>Mint 1000 IABS (0.01 NEAR)</button>
          {isOwner && (
            <button onClick={withdraw} style={{ marginLeft: 12 }}>
              Withdraw Contract Balance
            </button>
          )}
        </>
      ) : (
        <p>Please connect your wallet</p>
      )}
    </main>
  );
}
