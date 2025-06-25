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
RPC_FUJI=https://api.avax-test.network/ext/bc/C/rpc # RPC address of the netowk you want to deploy
```

### Execute the deploy cli

    npx hardhat run scripts/deploy.ts --network fuji

This command should display :

> Deploying with address: 0x37574FE84a73bA8c3942f70D2A41104bf0500E44
> Deployed to: 0xFFbC7A0F639a89bA6914a8D356769853C41AD52B

Then you can go on etherscan (on the chosen network here fuji to check your contract) :
https://testnet.snowtrace.io/address/0xFFbC7A0F639a89bA6914a8D356769853C41AD52B/contract/43113/code

### Contract verification

In order to help community to use your contract, etherscan allows to verify the contracts in order to show source code and use the functions directly through the etherscan ui.

```bash
npx hardhat verify --network fuji 0xFFbC7A0F639a89bA6914a8D356769853C41AD52B
```

**Command returns :**

> [INFO] Sourcify Verification Skipped: Sourcify verification is currently disabled. To enable it, add the following entry to your Hardhat configuration:
>
> sourcify: {
> enabled: true
> }
>
> Or set 'enabled' to false to hide this message.
>
> For more information, visit https://hardhat.org/hardhat-runner/plugins/nomicfoundation-hardhat-verify#verifying-on-sourcify
> Successfully submitted source code for contract
> contracts/IABS.sol:IABS at 0xFFbC7A0F639a89bA6914a8D356769853C41AD52B
> for verification on the block explorer. Waiting for verification result...
>
> Successfully verified contract IABS on the block explorer.
> https://avalanche.routescan.io/address/0xFFbC7A0F639a89bA6914a8D356769853C41AD52B#code
