# Blockchain Evaluation

This repository contains a technical evaluation of smart contract development across multiple blockchains. For each chain, a minimal test project is implemented to measure developer experience from setup to deployment.

## Project Scope

For each blockchain:

- A basic ERC20-style token is deployed
- A smart contract allows minting 1,000 tokens in exchange for 0.01 native token
- A minimal DApp interacts with the contract

## Structure

- `Ethereum/smartcontract/`: Solidity smart contract using Hardhat
- `Ethereum/dapp/`: Frontend interface to interact with the contract
- Future chains will follow the same folder structure

## Goals

- Evaluate ease of setup and local testing
- Assess documentation and tooling
- Compare deployment processes
- Identify pain points and strengths

## Status

- ✅ Ethereum (Hardhat)
- 🔲 Solana (Anchor)
- 🔲 Avalanche
- 🔲 Sui
- 🔲 Aptos
- 🔲 Near
- 🔲 Injective
- 🔲 Polkadot

Each folder contains its own `README.md` with setup instructions and explanations.
