import "@nomiclabs/hardhat-waffle";
import { ethers, waffle } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import { KannaBadges__factory, KannaBadges } from "../../../typechain-types";

export const getKannaBadgesFactory = async (deployerAddress: SignerWithAddress) => (await ethers.getContractFactory(
  "KannaBadges",
  deployerAddress
)) as KannaBadges__factory;

export const getKannaBadgesParameters = (
  uri: string = 'https://nft.kannacoin.io/{id}.json',
): [string] => {
  return [uri];
};

export const getKannaBadges = async (
  knnDeployerAddress: SignerWithAddress,
  uri: string = 'https://nft.kannacoin.io/{id}.json',
): Promise<KannaBadges> => {
  const parameters = getKannaBadgesParameters(uri);

  const KannaBadgesFactory = await getKannaBadgesFactory(knnDeployerAddress);

  const KannaBadges = await KannaBadgesFactory.deploy(...parameters);

  await KannaBadges.deployed();

  return KannaBadges;
};

export const getKannaBadgesMock = async (
  knnDeployerAddress: SignerWithAddress,
  uri: string = 'https://nft.kannacoin.io/{id}.json',
) => {
  const KannaBadges = await waffle.deployMockContract(knnDeployerAddress, KannaBadges__factory.abi);


  await KannaBadges.mock.uri.returns(uri);

  return KannaBadges;
};
