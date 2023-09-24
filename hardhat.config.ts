import { config as dotEnvConfig } from 'dotenv';
dotEnvConfig();

import type { HardhatUserConfig } from 'hardhat/types/config';

import '@nomiclabs/hardhat-waffle';
import '@typechain/hardhat';
import '@nomiclabs/hardhat-etherscan';
import 'solidity-coverage';
import 'hardhat-gas-reporter';

interface CustomNetworkConfig {
  tokenAddress?: string;
  priceAggregator?: string;
}

declare module "hardhat/types/config" {
  export interface HardhatNetworkUserConfig extends CustomNetworkConfig { }
  export interface HttpNetworkUserConfig extends CustomNetworkConfig { }
}

const PRIVATE_KEY = process.env.PRIVATE_KEY as string;

const config: HardhatUserConfig = {
  defaultNetwork: 'hardhat',
  solidity: {
    compilers: [
      {
        version: '0.8.21',
        settings: {
          optimizer: {
            enabled: true,
            runs: 1000,
          },
        },
      },
    ],
  },
  networks: {
    hardhat: {
      forking: {
        // eslint-disable-next-line
        enabled: true,
        url: process.env.RPC_NODE_ENDPOINT || '',
        // blockNumber: 8890396,
      },
      mining: {
        mempool: {
          order: 'fifo',
        },
      },
      tokenAddress: process.env.TOKEN_ADDRESS,
      priceAggregator: process.env.PRICE_AGGREGATOR_ADDRESS,
    },
    localhost: {},
    goerli: {
      url:
        process.env.GOERLI_RPC_NODE_ENDPOINT || process.env.RPC_NODE_ENDPOINT,
      accounts: [process.env.GOERLI_PRIVATE_KEY || PRIVATE_KEY],
      tokenAddress:
        process.env.GOERLI_TOKEN_ADDRESS || process.env.TOKEN_ADDRESS,
      priceAggregator: process.env.GOERLI_PRICE_AGGREGATOR_ADDRESS,
    },
    sepolia: {
      url:
        process.env.SEPOLIA_RPC_NODE_ENDPOINT || process.env.RPC_NODE_ENDPOINT,
      accounts: [process.env.SEPOLIA_PRIVATE_KEY || PRIVATE_KEY],
      tokenAddress:
        process.env.SEPOLIA_TOKEN_ADDRESS || process.env.TOKEN_ADDRESS,
      priceAggregator: process.env.SEPOLIA_PRICE_AGGREGATOR_ADDRESS,
    },
    polygon: {
      url:
        process.env.POLYGON_RPC_NODE_ENDPOINT || process.env.RPC_NODE_ENDPOINT,
      accounts: [process.env.POLYGON_PRIVATE_KEY || PRIVATE_KEY],
      tokenAddress:
        process.env.POLYGON_TOKEN_ADDRESS || process.env.TOKEN_ADDRESS,
      priceAggregator: process.env.POLYGON_PRICE_AGGREGATOR_ADDRESS,
    },
    polygonMumbai: {
      url:
        process.env.MUMBAI_RPC_NODE_ENDPOINT || process.env.RPC_NODE_ENDPOINT,
      accounts: [process.env.MUMBAI_PRIVATE_KEY || PRIVATE_KEY],
      tokenAddress:
        process.env.MUMBAI_TOKEN_ADDRESS || process.env.TOKEN_ADDRESS,
      priceAggregator: process.env.MUMBAI_PRICE_AGGREGATOR_ADDRESS,
    },
    coverage: {
      url: 'http://127.0.0.1:8555', // Coverage launches its own ganache-cli client
    },
  },
  etherscan: {
    apiKey: {
      mainnet: process.env.ETHERSCAN_API_KEY || '',
      goerli: process.env.ETHERSCAN_API_KEY || '',
      sepolia: process.env.ETHERSCAN_API_KEY || '',
      polygon: process.env.POLYGONSCAN_API_KEY || '',
      polygonMumbai: process.env.POLYGONSCAN_API_KEY || '',
    },
  },
  gasReporter: {
    enabled: true,
    currency: 'USD'
  },
};

export default config;
