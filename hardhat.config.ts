import { config as dotEnvConfig } from "dotenv";
dotEnvConfig();

import { HardhatUserConfig } from "hardhat/types";

import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "@nomiclabs/hardhat-etherscan";
import "solidity-coverage";

interface Etherscan {
  etherscan: { apiKey: string | undefined };
}

type HardhatUserEtherscanConfig = HardhatUserConfig & Etherscan;

const API_URL = process.env.API_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY as string;
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;

const config: HardhatUserEtherscanConfig = {
  defaultNetwork: "hardhat",
  solidity: {
    compilers: [{ version: "0.8.9", settings: {} }],
  },
  networks: {
    hardhat: {
      mining: {
        mempool: {
          order: "fifo",
        },
      },
    },
    localhost: {},
    // goerli: {
    //   url: API_URL,
    //   accounts: [PRIVATE_KEY],
    // },
    coverage: {
      url: "http://127.0.0.1:8555", // Coverage launches its own ganache-cli client
    },
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
};

export default config;
