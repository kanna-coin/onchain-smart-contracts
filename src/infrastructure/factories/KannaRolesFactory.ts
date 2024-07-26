import '@nomiclabs/hardhat-waffle';
import { ethers, waffle } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

import { KannaRoles__factory, KannaRoles, IKannaRoleProvier__factory } from '../../../typechain-types';

export const getKannaRolesFactory = async (
  deployerAddress: SignerWithAddress
) =>
  (await ethers.getContractFactory(
    'KannaRoles',
    deployerAddress
  )) as KannaRoles__factory;

export const getKannaRoles = async (
  knnDeployerAddress: SignerWithAddress
): Promise<KannaRoles> => {
  const KannaRolesFactory = await getKannaRolesFactory(knnDeployerAddress);

  const KannaRoles = await KannaRolesFactory.deploy();

  await KannaRoles.deployed();

  return KannaRoles;
};

export const getKannaRolesMock = async (
  knnDeployerAddress: SignerWithAddress
) => {
  const KannaRoles = await waffle.deployMockContract(knnDeployerAddress, [
    ...KannaRoles__factory.abi,
  ]);

  return KannaRoles;
};

export const getKannaRoleProvierMock = async (
  knnDeployerAddress: SignerWithAddress,
) => {
  const KannaRoleProvier = await waffle.deployMockContract(knnDeployerAddress, [...IKannaRoleProvier__factory.abi]);

  await KannaRoleProvier.mock.supportsInterface.returns(true);

  return KannaRoleProvier;
};