import '@nomiclabs/hardhat-waffle';
import { ethers } from 'hardhat';
import { MockContract } from 'ethereum-waffle';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import {
  KannaDynamicPriceSaleL2__factory,
  KannaDynamicPriceSaleL2,
  KannaToken,
} from '../../../typechain-types';

const parse1e18 = (integer: number): string => `${integer}000000000000000000`;

const saleAmount = parse1e18(100_000);

export const getKnnDynamicPriceSaleL2Factory = async (deployerAddress: SignerWithAddress) =>
  (await ethers.getContractFactory(
    'KannaDynamicPriceSaleL2',
    deployerAddress
  )) as KannaDynamicPriceSaleL2__factory;

export const getDynamicPriceSaleL2Parameters = (
  knnToken: KannaToken | MockContract
) => {
  return [knnToken.address] as const;
};

export const getKnnDynamicPriceSaleL2 = async (
  knnDeployerAddress: SignerWithAddress,
  knnToken: KannaToken | MockContract,
  knnTreasurer?: KannaToken | MockContract
): Promise<KannaDynamicPriceSaleL2> => {
  const parameters = getDynamicPriceSaleL2Parameters(knnToken);

  const knnDynamicSaleFactory = await getKnnDynamicPriceSaleL2Factory(knnDeployerAddress);

  const knnDynamicSale = await knnDynamicSaleFactory.deploy(...parameters);

  await knnDynamicSale.deployed();

  if (knnTreasurer) {
    await knnTreasurer.transfer(knnDynamicSale.address, saleAmount);
  }

  return knnDynamicSale;
};
