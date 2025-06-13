# Dapp deployment process

## Setup the dev environment

    npm init -y
    npm install --save-dev hardhat
    npx hardhat

## Run the unit tests

    npx hardhat test

## Deploy on any network

### Setup your .env

Content of the .env

```bash
PRIVATE_KEY=0xf987f987c8... # Private address of your wallet
RPC_SEPOLIA=https://eth-sepolia.g.alchemy.com/v2/xxx # RPC address of the netowk you want to deploy
ETHERSCAN_API_KEY=..... # Etherscan api key for verification
```

### Execute the deploy cli

    npx hardhat run scripts/deploy.ts --network sepolia

This command should display :

> Deploying with address: 0x37574FE84a73bA8c3942f70D2A41104bf0500E44
> Deployed to: 0xFFbC7A0F639a89bA6914a8D356769853C41AD52B

Then you can go on etherscan (on the chosen network here sepolia to check your contract) :
https://sepolia.etherscan.io/address/0xFFbC7A0F639a89bA6914a8D356769853C41AD52B#code

### Contract verification

In order to help community to use your contract, etherscan allows to verify the contracts in order to show source code and use the functions directly through the etherscan ui.

```bash
hardhat verify --network sepolia 0xFFbC7A0F639a89bA6914a8D356769853C41AD52B
```

**Command returns :**

> Successfully submitted source code for contract
> contracts/IABS.sol:IABS at 0xFFbC7A0F639a89bA6914a8D356769853C41AD52B
> for verification on the block explorer. Waiting for verification result...
>
> Successfully verified contract IABS on the block explorer.
> https://sepolia.etherscan.io/address/0xFFbC7A0F639a89bA6914a8D356769853C41AD52B#code
