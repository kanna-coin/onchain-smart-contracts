import "@nomiclabs/hardhat-waffle";
import { ethers, waffle } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import { KannaBadgesL2__factory, KannaBadgesL2 } from "../../../typechain-types";

export const getKannaBadgesL2Factory = async (deployerAddress: SignerWithAddress) => (await ethers.getContractFactory(
  "KannaBadgesL2",
  deployerAddress
)) as KannaBadgesL2__factory;

export const getKannaBadgesL2Parameters = (
  uri: string = 'https://nft.kannacoin.io/{id}.json',
): [string] => {
  return [uri];
};

export const getKannaBadgesL2 = async (
  knnDeployerAddress: SignerWithAddress,
  uri: string = 'https://nft.kannacoin.io/{id}.json',
): Promise<KannaBadgesL2> => {
  const parameters = getKannaBadgesL2Parameters(uri);

  const KannaBadgesL2Factory = await getKannaBadgesL2Factory(knnDeployerAddress);

  const KannaBadgesL2 = await KannaBadgesL2Factory.deploy(...parameters);

  await KannaBadgesL2.deployed();

  return KannaBadgesL2;
};

export const getKannaBadgesL2Mock = async (
  knnDeployerAddress: SignerWithAddress,
  uri: string = 'https://nft.kannacoin.io/{id}.json',
) => {
  const KannaBadgesL2 = await waffle.deployMockContract(knnDeployerAddress, [...KannaBadgesL2__factory.abi]);


  await KannaBadgesL2.mock.uri.returns(uri);

  return KannaBadgesL2;
};
