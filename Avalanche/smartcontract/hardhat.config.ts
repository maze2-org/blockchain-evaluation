import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
import "@nomicfoundation/hardhat-verify";


dotenv.config();

const config: HardhatUserConfig = {
  etherscan: {
    apiKey: {
      fuji: "fuji"
    },
    customChains: [
      {
        network: "fuji",
        chainId: 43113,
        urls: {
          apiURL: "https://api.routescan.io/v2/network/testnet/evm/43113/etherscan",
          browserURL: "https://avalanche.routescan.io"
        }
      }
    ]
  },

  networks: {
    fuji: {
      url: process.env.RPC_FUJI || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
  solidity: "0.8.28",
};

export default config;
