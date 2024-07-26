import { ethers, run } from 'hardhat';
import '@nomiclabs/hardhat-etherscan';
import { AggregatorV3Mock__factory } from '../typechain-types';

const sleep = (seconds: number) =>
  new Promise((resolve) => setTimeout(resolve, 1000 * seconds));

async function main() {
  const [deployerWallet] = await ethers.getSigners();

  const aggregatorV3factory = (await ethers.getContractFactory(
    'AggregatorV3Mock',
    deployerWallet
  )) as AggregatorV3Mock__factory;

  // Polygon [matc-eth] -> e.g: 0.000477305865673918 (https://data.chain.link/polygon/mainnet/crypto-eth/matic-eth)
  // const aggregator = await aggregatorV3factory.deploy('477305865673918');

  // goerli [brl-usd] -> e.g: 0.20266710
  // const aggregator = await aggregatorV3factory.deploy('20266710');

  // goerli [matic-usd] -> e.g.: 0.85903794
  const aggregator = await aggregatorV3factory.deploy('85903794');
  const { address } = aggregator;

  await aggregator.deployed();

  console.log(`AggregatorV3Mock: ${address}\n`);
  await sleep(2);

  await run('verify:verify', {
    address,
    constructorArguments: ['20266710'],
  });
  sleep(2);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
