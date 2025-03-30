import '@nomiclabs/hardhat-waffle';
import { ethers, waffle } from 'hardhat';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

import { KannaAuditAnswers__factory, KannaAuditAnswers } from '../../../typechain-types';

export const getKannaAuditAnswersFactory = async (
  deployerAddress: SignerWithAddress
) =>
  (await ethers.getContractFactory(
    'KannaAuditAnswers',
    deployerAddress
  )) as KannaAuditAnswers__factory;

export const getKannaAuditAnswers = async (
  knnDeployerAddress: SignerWithAddress,
  stakePoolAddress: string
): Promise<KannaAuditAnswers> => {
  const KannaAuditAnswersFactory = await getKannaAuditAnswersFactory(knnDeployerAddress);

  const KannaAuditAnswers = await KannaAuditAnswersFactory.deploy(stakePoolAddress);

  await KannaAuditAnswers.deployed();

  return KannaAuditAnswers;
};

export const getKannaAuditAnswersMock = async (
  knnDeployerAddress: SignerWithAddress
) => {
  const KannaAuditAnswers = await waffle.deployMockContract(knnDeployerAddress, [
    ...KannaAuditAnswers__factory.abi,
  ]);

  return KannaAuditAnswers;
};
