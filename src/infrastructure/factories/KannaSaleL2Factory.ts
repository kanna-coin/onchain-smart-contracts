import '@nomiclabs/hardhat-waffle';
import { ethers, waffle } from 'hardhat';
import { MockContract } from 'ethereum-waffle';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import {
  KannaSaleL2__factory,
  KannaSaleL2,
  KannaToken,
} from '../../../typechain-types';

const parse1e18 = (integer: number): string => `${integer}000000000000000000`;

const saleAmount = parse1e18(100_000);

const defaultQuotation = '60000000';

export const getKnnSaleL2Factory = async (deployerAddress: SignerWithAddress) =>
  (await ethers.getContractFactory(
    'KannaSaleL2',
    deployerAddress
  )) as KannaSaleL2__factory;

export const getSaleL2Parameters = (
  knnToken: KannaToken | MockContract,
  aggregatorAddress: string = process.env.PRICE_AGGREGATOR_ADDRESS!,
  quotation: string = defaultQuotation
): [string, string, string] => {
  return [knnToken.address, aggregatorAddress, quotation];
};

export const getKnnSaleL2 = async (
  knnDeployerAddress: SignerWithAddress,
  knnToken: KannaToken | MockContract,
  knnTreasurer?: KannaToken | MockContract,
  aggregatorAddress: string = process.env.PRICE_AGGREGATOR_ADDRESS!,
  quotation: string = defaultQuotation
): Promise<KannaSaleL2> => {
  const parameters = getSaleL2Parameters(
    knnToken,
    aggregatorAddress,
    quotation
  );

  const knnSaleFactory = await getKnnSaleL2Factory(knnDeployerAddress);

  const knnSale = await knnSaleFactory.deploy(...parameters);

  await knnSale.deployed();

  if (knnTreasurer) {
    await knnTreasurer.transfer(knnSale.address, saleAmount);
  }

  return knnSale;
};

export const getKnnSaleL2Mock = async (
  knnDeployerAddress: SignerWithAddress
) => {
  const knnPreSale = await waffle.deployMockContract(knnDeployerAddress, [
    ...KannaSaleL2__factory.abi,
  ]);

  return knnPreSale;
};
