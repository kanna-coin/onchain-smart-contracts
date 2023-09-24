import '@nomiclabs/hardhat-waffle';
import { ethers, waffle } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import {
  KannaStockOption__factory,
  KannaStockOption,
} from '../../../typechain-types';

export const getKannaStockOptionFactory = async (
  deployerAddress: SignerWithAddress
) =>
  (await ethers.getContractFactory(
    'KannaStockOption',
    deployerAddress
  )) as KannaStockOption__factory;

export const getKannaStockOption = async (
  knnDeployerAddress: SignerWithAddress
): Promise<KannaStockOption> => {
  const knnSop = await getKannaStockOptionFactory(knnDeployerAddress);

  const knnSale = await knnSop.deploy();

  await knnSale.deployed();

  return knnSale;
};

export const getKannaStockOptionMock = async (
  knnDeployerAddress: SignerWithAddress
) => {
  const KannaStockOption = await waffle.deployMockContract(knnDeployerAddress, [
    ...KannaStockOption__factory.abi,
  ]);

  return KannaStockOption;
};
