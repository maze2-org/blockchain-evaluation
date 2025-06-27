#!/bin/bash

echo "Deploying IABS contract to Aptos testnet..."

if ! command -v aptos &> /dev/null; then
    echo "Aptos CLI is not installed. Please install it first:"
    echo "   https://aptos.dev/cli-tools/aptos-cli-tool/install-aptos-cli"
    exit 1
fi

if [ ! -f ".aptos/config.yaml" ]; then
    echo "Initializing Aptos account..."
    aptos init --network testnet
fi

echo "Compiling Move contract..."
aptos move compile --named-addresses deployer=default

if [ $? -ne 0 ]; then
    echo "Contract compilation failed!"
    exit 1
fi

echo "Deploying to testnet..."
aptos move publish --named-addresses deployer=default --profile default

if [ $? -eq 0 ]; then
    echo "Contract deployed successfully!"
    echo "Contract address: $(aptos config show-profiles --profile default | grep 'account' | cut -d':' -f2 | tr -d ' ')"
    echo "View on explorer: https://explorer.aptoslabs.com/?network=testnet"
else
    echo "Deployment failed!"
    exit 1
fi
