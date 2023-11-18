import '@nomiclabs/hardhat-waffle';
import { ethers } from 'hardhat';
import { MockContract } from 'ethereum-waffle';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import {
  KannaDynamicPriceSale__factory,
  KannaDynamicPriceSale,
  KannaToken,
} from '../../../typechain-types';

const parse1e18 = (integer: number): string => `${integer}000000000000000000`;

const saleAmount = parse1e18(100_000);

export const getKnnDynamicPriceSaleFactory = async (deployerAddress: SignerWithAddress) =>
  (await ethers.getContractFactory(
    'KannaDynamicPriceSale',
    deployerAddress
  )) as KannaDynamicPriceSale__factory;

export const getDynamicPriceSaleParameters = (
  knnToken: KannaToken | MockContract
) => {
  return [knnToken.address] as const;
};

export const getKnnDynamicPriceSale = async (
  knnDeployerAddress: SignerWithAddress,
  knnToken: KannaToken | MockContract,
  knnTreasurer?: KannaToken | MockContract
): Promise<KannaDynamicPriceSale> => {
  const parameters = getDynamicPriceSaleParameters(knnToken);

  const knnDynamicSaleFactory = await getKnnDynamicPriceSaleFactory(knnDeployerAddress);

  const knnDynamicSale = await knnDynamicSaleFactory.deploy(...parameters);

  await knnDynamicSale.deployed();

  if (knnTreasurer) {
    await knnTreasurer.transfer(knnDynamicSale.address, saleAmount);
  }

  return knnDynamicSale;
};
