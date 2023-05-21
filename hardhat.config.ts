import { config as dotEnvConfig } from "dotenv";
dotEnvConfig();

import { HardhatUserConfig } from "hardhat/types";

import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "@nomiclabs/hardhat-etherscan";
import "solidity-coverage";

declare module "hardhat/types" {
  export interface HardhatNetworkConfig {
    priceAggregator?: string;
  }

  export interface HttpNetworkConfig {
    priceAggregator?: string;
  }

  export interface HardhatNetworkUserConfig {
    priceAggregator?: string;
  }

  export interface HttpNetworkUserConfig {
    priceAggregator?: string;
  }
}

interface Etherscan {
  etherscan: {
    apiKey: Record<string, string | undefined>
  };
}

type HardhatUserEtherscanConfig = HardhatUserConfig & Etherscan;

const PRIVATE_KEY = process.env.PRIVATE_KEY as string;

const config: HardhatUserEtherscanConfig = {
  defaultNetwork: "hardhat",
  solidity: {
    compilers: [{ version: "0.8.17", settings: {} }],
  },
  networks: {
    hardhat: {
      forking: {
        // eslint-disable-next-line
        enabled: true,
        url: process.env.RPC_NODE_ENDPOINT || "",
        // blockNumber: 15704870,
      },
      mining: {
        mempool: {
          order: "fifo",
        },
      },
      priceAggregator: process.env.PRICE_AGGREGATOR_ADDRESS,
    },
    localhost: {},
    goerli: {
      url: process.env.GOERLI_RPC_NODE_ENDPOINT || process.env.RPC_NODE_ENDPOINT,
      accounts: [process.env.GOERLI_PRIVATE_KEY || PRIVATE_KEY],
      priceAggregator: process.env.GOERLI_PRICE_AGGREGATOR_ADDRESS,
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC_NODE_ENDPOINT || process.env.RPC_NODE_ENDPOINT,
      accounts: [process.env.SEPOLIA_PRIVATE_KEY || PRIVATE_KEY],
      priceAggregator: process.env.SEPOLIA_PRICE_AGGREGATOR_ADDRESS,
    },
    polygon: {
      url: process.env.POLYGON_RPC_NODE_ENDPOINT || process.env.RPC_NODE_ENDPOINT,
      accounts: [process.env.POLYGON_PRIVATE_KEY || PRIVATE_KEY],
      priceAggregator: process.env.POLYGON_PRICE_AGGREGATOR_ADDRESS,
    },
    mumbai: {
      url: process.env.MUMBAI_RPC_NODE_ENDPOINT || process.env.RPC_NODE_ENDPOINT,
      accounts: [process.env.MUMBAI_PRIVATE_KEY || PRIVATE_KEY],
      priceAggregator: process.env.MUMBAI_PRICE_AGGREGATOR_ADDRESS,
    },
    coverage: {
      url: "http://127.0.0.1:8555", // Coverage launches its own ganache-cli client
    },
  },
  etherscan: {
    apiKey: {
      mainnet: process.env.ETHERSCAN_API_KEY,
      goerli: process.env.ETHERSCAN_API_KEY,
      sepolia: process.env.ETHERSCAN_API_KEY,
      polygon: process.env.POLYGONSCAN_API_KEY,
      mumbai: process.env.POLYGONSCAN_API_KEY,
    }
  },
};

export default config;
