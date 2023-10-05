import '@nomiclabs/hardhat-waffle';
import { ethers, waffle } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import {
  KannaStockOptionManager__factory,
  KannaStockOptionManager,
} from '../../../typechain-types';

export const getKannaStockOptionManagerFactory = async (
  deployerAddress: SignerWithAddress
) =>
  (await ethers.getContractFactory(
    'KannaStockOptionManager',
    deployerAddress
  )) as KannaStockOptionManager__factory;

export const getKannaStockOptionManager = async (
  knnDeployerAddress: SignerWithAddress
): Promise<KannaStockOptionManager> => {
  const knnSop = await getKannaStockOptionManagerFactory(knnDeployerAddress);

  const knnSale = await knnSop.deploy();

  await knnSale.deployed();

  return knnSale;
};

export const getKannaStockOptionManagerMock = async (
  knnDeployerAddress: SignerWithAddress
) => {
  const KannaStockOptionManager = await waffle.deployMockContract(knnDeployerAddress, [
    ...KannaStockOptionManager__factory.abi,
  ]);

  return KannaStockOptionManager;
};
