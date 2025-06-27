import {convertAptToOcta} from "./helpers.ts";

export const APP_CONFIG = {
  NETWORK: "testnet" as const,
  // CONTRACT_ADDRESS: '0x{{CONTRACT_ADDRESS}}', // Update this after deployment
  CONTRACT_ADDRESS: "0x66da5deaafe9b7bc30c67c3fe3044c7d1af12a5477fa2cfb830f370232ceb9ea", // Already deployed contract
  CONTRACT_MODULE_NAME: "IABS",
  TOKEN_NAME: "IABS",
  TOKEN_SYMBOL: "IABS",
  EXCHANGE_RATE: {
    APT_TO_IABS: 1000,
    APT_AMOUNT: 0.01,
  },
  APTOS_FAUCET_URL: "https://aptos.dev/en/network/faucet",
  EXPLORER_BASE_URL: "https://explorer.aptoslabs.com",
  WALLET_CONNECT_TIMEOUT: 30000,
  TRANSACTION_TIMEOUT: 60000,
  MINT_APT_AMOUNT_OCTAS: convertAptToOcta(0.01),
} as const;

const CONTRACT_MODULE: `${string}::${string}` = `${APP_CONFIG.CONTRACT_ADDRESS}::${APP_CONFIG.CONTRACT_MODULE_NAME}`;

export const CONTRACT_FUNCTIONS = {
  MINT: `${CONTRACT_MODULE}::mint`,
  WITHDRAW: `${CONTRACT_MODULE}::withdraw`,
  GET_OWNER: `${CONTRACT_MODULE}::get_owner`,
  GET_TOTAL_SUPPLY: `${CONTRACT_MODULE}::get_total_supply`,
  GET_CONTRACT_BALANCE: `${CONTRACT_MODULE}::get_contract_balance`,
} as const;
