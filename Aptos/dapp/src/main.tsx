import './index.css';

import React from 'react';
import ReactDOM from 'react-dom/client';
import {AptosWalletAdapterProvider} from '@aptos-labs/wallet-adapter-react';

import App from './App';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <AptosWalletAdapterProvider autoConnect={true}>
      <App/>
    </AptosWalletAdapterProvider>
  </React.StrictMode>
);
