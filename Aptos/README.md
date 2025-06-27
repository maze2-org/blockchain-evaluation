# IABS Token dApp

A full-stack decentralized application built on Aptos blockchain featuring IABS token minting and withdrawal
functionality.

## Features

- **Smart Contract**: Move-based IABS token contract with mint and withdraw functions
- **Frontend**: React TypeScript application with wallet integration
- **Wallet Support**: Petra wallet integration
- **Token Economics**: Exchange 0.01 APT for 1000 IABS tokens
- **Owner Functions**: Contract owner can withdraw accumulated APT

## Prerequisites

Before getting started, ensure you have:

- [Node.js](https://nodejs.org/)
- [Aptos CLI](https://aptos.dev/cli-tools/aptos-cli-tool/install-aptos-cli)
- [Petra Wallet](https://petra.app)
- Testnet APT tokens from [Aptos Faucet](https://aptos.dev/en/network/faucet)

## Setup Instructions

### 1. Install Dependencies

```bash
# Install frontend dependencies
cd dapp
npm install
```

### 2. Deploy Smart Contract

#### Option A: Quick Deploy (Recommended)

```bash
# Navigate to contract directory
cd contract

# Run the simplified contract deployment script
sh deploy.sh
```

#### Option B: Manual Deployment

```bash
# Navigate to contract directory
cd contract

# Initialize Aptos CLI (if not done before)
aptos init --network testnet

# Fund your account with testnet APT
# Visit the faucet URL provided by the CLI or go to:
# https://aptos.dev/en/network/faucet

# Compile the contract (replace YOUR_ADDRESS with your account address)
aptos move compile --named-addresses deployer=YOUR_ADDRESS

# Deploy the contract
aptos move publish --named-addresses deployer=YOUR_ADDRESS
```

### 3. Configure Frontend

After successful deployment, update the contract address in `dapp/src/constants.ts`:

```typescript
// Importnat: Replace with your deployed contract address (keep 0x)
const CONTRACT_ADDRESS = "0x{{CONTRACT_ADDRESS}}";
```

### 4. Start Development Server

```bash
# Navigate to frontend directory (if not already there)
cd dapp

# Start the development server
npm run dev
```

### Deployment Verification

After deployment, verify your contract on the [Aptos Explorer](https://explorer.aptoslabs.com/?network=testnet) by
searching for your contract address.
