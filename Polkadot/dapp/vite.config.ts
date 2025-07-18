import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5000,
  },
  preview: {
    host: '0.0.0.0',
    port: 5000,
  },
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    include: ['@polkadot/api', '@polkadot/api-contract', '@polkadot/extension-dapp']
  }
})
