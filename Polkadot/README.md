# IABS Token Contract Deployment on Shibuya testnet on Astar Network

### *[Documentation](https://docs.polkadot.com/develop/parachains/install-polkadot-sdk/)*

## Install Required Packages and Rust
- Open the Terminal application
- Ensure you have an updated version of Homebrew by running the following command:
```
brew update
```
- Install the openssl package by running the following command:
```
brew install openssl
```
- Download the rustup installation program and use it to install Rust by running the following command:
```
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```
- Follow the prompts displayed to proceed with a default installation
- Update your current shell to include Cargo by running the following command:
```
source ~/.cargo/env
```
- Configure the Rust toolchain to default to the latest stable version by running the following commands:
```
rustup default stable
rustup update
rustup target add wasm32-unknown-unknown
rustup component add rust-src
```
- [Verifying Installation](https://docs.polkadot.com/develop/parachains/install-polkadot-sdk/#verifying-installation)
- Install cmake using the following command:
```
brew install cmake
```

---

## Build and deploy contract

- Build contract
```
cargo contract build --release
```

- Upload contract code optional
```
cargo contract upload \
--suri "wallet passphrase" \
--url wss://rpc.shibuya.astar.network
```

- Instantiate contract
```
cargo contract instantiate \
--constructor new \
--suri "wallet passphrase" \
--url wss://rpc.shibuya.astar.network \
--execute
```

---

### If contract already deployed
```
Contracts::DuplicateContract: ["A contract with the same AccountId already exists."]
``` 

- Generate unique id (salt)
```
echo -n "unique1" | xxd -p // 756e6971756531
echo -n "unique2" | xxd -p // 756e6971756532
echo -n "unique3" | xxd -p // 756e6971756533
```

```
cargo contract instantiate \
--constructor new \
--suri "wallet passphrase" \
--url wss://rpc.shibuya.astar.network \
--salt "756e6971756533" \
--execute
```

---


### Resources & Links

| Resource Description                          | Link                                                                                                                    |
|-----------------------------------------------|-------------------------------------------------------------------------------------------------------------------------|
| Polkadot.js API Contracts Guide               | [polkadot.js.org/docs/api-contract/start/contract.read](https://polkadot.js.org/docs/api-contract/start/contract.read/) |
| Polkadot SDK Installation Guide               | [docs.polkadot.com](https://docs.polkadot.com/develop/parachains/install-polkadot-sdk/)                                 |
| Polkadot-JS Apps (contract UI)                | [polkadot.js.org/apps](https://polkadot.js.org/apps/#/contracts)                                                        |
| Astar Network Portal - Shibuya Testnet Faucet | [portal.astar.network](https://portal.astar.network/shibuya-testnet/assets)                                             |
| Polkadot Developer Signer                     | [Polkadot Developer Signer](https://polkadot.js.org/extension)                                                          |
