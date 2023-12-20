import '@nomiclabs/hardhat-waffle';
import { ethers, waffle } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import {
  KannaAuditStakePool__factory,
  KannaAuditStakePool,
  IKannaAuditScoreProvider__factory
} from '../../../typechain-types';

export const getKannaAuditStakePoolFactory = async (
  deployerAddress: SignerWithAddress
) =>
  (await ethers.getContractFactory(
    'KannaAuditStakePool',
    deployerAddress
  )) as KannaAuditStakePool__factory;

export const getKannaAuditStakePool = async (
  deployerAddress: SignerWithAddress
): Promise<KannaAuditStakePool> => {
  const auditStakePoolFactory = await getKannaAuditStakePoolFactory(deployerAddress);

  const auditStakePool = await auditStakePoolFactory.deploy();

  await auditStakePool.deployed();

  return auditStakePool;
};

export const getKannaAuditStakePoolMock = async (
  deployerAddress: SignerWithAddress
) => {
  const KannaAuditStakePool = await waffle.deployMockContract(deployerAddress, [
    ...KannaAuditStakePool__factory.abi,
  ]);

  return KannaAuditStakePool;
};

export const getKannaAuditScoreProviderMock = async (
  deployerAddress: SignerWithAddress
) => {
  const KannaAuditScoreProvider = await waffle.deployMockContract(deployerAddress, [
    ...IKannaAuditScoreProvider__factory.abi,
  ]);

  return KannaAuditScoreProvider;
};
