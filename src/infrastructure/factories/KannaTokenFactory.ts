import '@nomiclabs/hardhat-waffle';
import { ethers, waffle } from 'hardhat';
import { BigNumberish, constants } from 'ethers';
import { MockContract } from 'ethereum-waffle';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

import { KannaToken__factory, KannaToken } from '../../../typechain-types';

export const getKannaTokenFactory = async (
  deployerAddress: SignerWithAddress
) =>
  (await ethers.getContractFactory(
    'KannaToken',
    deployerAddress
  )) as KannaToken__factory;

export const getKnnToken = async (
  knnDeployerAddress: SignerWithAddress,
  treasuryAddress?: SignerWithAddress
): Promise<KannaToken> => {
  const KannaTokenFactory = await getKannaTokenFactory(knnDeployerAddress);

  const KannaToken = await KannaTokenFactory.deploy();

  await KannaToken.deployed();

  if (treasuryAddress) {
    await KannaToken.initializeTreasury(treasuryAddress.address);
  }

  return KannaToken;
};

export const getKnnTreasurer = async (
  kannaToken: KannaToken | MockContract
) => {
  const treasuryAdress = await kannaToken.treasury();

  if (treasuryAdress === constants.AddressZero) {
    return;
  }

  const treasurySigner = await ethers.getSigner(treasuryAdress);

  return (await kannaToken.connect(treasurySigner)) as KannaToken;
};

export const releaseFromTreasury = async (
  kannaToken: KannaToken | MockContract,
  recipient: string,
  amount: BigNumberish
) => {
  const treasuryInstance = await getKnnTreasurer(kannaToken);

  if (!treasuryInstance) {
    return;
  }

  return treasuryInstance.transfer(recipient, amount);
};

export const getKnnTokenMock = async (
  knnDeployerAddress: SignerWithAddress,
  treasuryAddress?: SignerWithAddress
) => {
  const KannaToken = await waffle.deployMockContract(knnDeployerAddress, [
    ...KannaToken__factory.abi,
  ]);

  if (treasuryAddress) {
    await KannaToken.mock.treasury.returns(treasuryAddress.address);
  }

  return KannaToken;
};
