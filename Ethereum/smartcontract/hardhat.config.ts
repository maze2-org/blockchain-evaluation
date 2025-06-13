import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
import "@nomicfoundation/hardhat-verify";


dotenv.config();

const config: HardhatUserConfig = {
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  networks: {
    sepolia: {
      url: process.env.RPC_SEPOLIA || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
  solidity: "0.8.28",
};

export default config;
