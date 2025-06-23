
# Sui Contract Deployment Guide

## Prerequisites

### Install Rust and Cargo
```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

### Install Sui CLI
```bash
# Install Sui CLI via Homebrew
brew install sui
```

### Configure Sui Client
```bash
# Initialize Sui client (creates local wallet and config)
sui client

# Add testnet environment
sui client new-env --alias testnet --rpc https://fullnode.testnet.sui.io:443

# Switch to testnet
sui client switch --env testnet
```

---

## Testnet Deployment

### 1. Get Testnet SUI Tokens
```bash
# Request tokens from the faucet
sui client faucet

# Check balance
sui client balance
```

### 2. Build and Deploy Contract
```bash
# Navigate to contract directory
cd smartcontract

# Build Move package
sui move build

# Publish to testnet (adjust gas budget as needed)
sui client publish --gas-budget 200000000
```

> ⚠️ **Note**: Copy the `PackageID` from the publish output.  
Example:  
`PackageID: 0x0000000000000000000000000000000000000000000000000000000000000000`

### 3. Verify Deployment
```bash
# View deployed package details
sui client object <PACKAGE_ID>

# List wallet addresses
sui client addresses

# Export private key (for wallet import)
sui keytool export --key-identity <ADDRESS>
```

---

## Frontend Configuration

Update your frontend with the deployed contract details:

```ts
// dapp/src/config/config.ts
export const CONTRACT_CONFIG = {
    packageId: '0x0000000000000000000000000000000000000000000000000000000000000000',
    contractAddress: '0x0000000000000000000000000000000000000000000000000000000000000000',
};

export const NETWORK = 'testnet';
export const RPC_URL = 'https://fullnode.testnet.sui.io:443';
```

---

## Network Endpoints

- **Localnet**: `http://127.0.0.1:9000`
- **Testnet**: `https://fullnode.testnet.sui.io:443`
- **Devnet**: `https://fullnode.devnet.sui.io:443`
- **Mainnet**: `https://fullnode.mainnet.sui.io:443`

---

## Useful Commands

### Package Management & CLI Reference

- [Sui CLI Docs](https://docs.sui.io/references/cli)

---

## Troubleshooting

- **Insufficient Gas**: Increase the `--gas-budget` parameter.
- **Package Not Found**: Ensure the `PackageID` is correct.
- **Object Ownership Errors**: Verify object ownership via `sui client object <ID>`.
- **RPC Errors**: Check network connectivity and endpoint.
- **Version Mismatch**: Ensure CLI matches target network version.

---

## Explorer Links

- **Testnet**: [suiscan.xyz/testnet](https://suiscan.xyz/testnet)
- **Devnet**: [suiscan.xyz/devnet](https://suiscan.xyz/devnet)
- **Mainnet**: [suiscan.xyz/mainnet](https://suiscan.xyz/mainnet)

