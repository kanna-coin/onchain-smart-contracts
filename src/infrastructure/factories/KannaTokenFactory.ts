import "@nomiclabs/hardhat-waffle";
import { ethers, waffle } from "hardhat";
import { KannaToken__factory, KannaToken } from "../../../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

export const getKnnToken = async (
  knnDeployerAddress: SignerWithAddress
): Promise<KannaToken> => {
  let KannaToken: KannaToken;

  const KannaTokenFactory = (await ethers.getContractFactory(
    "KannaToken",
    knnDeployerAddress
  )) as KannaToken__factory;
  KannaToken = await KannaTokenFactory.deploy();

  await KannaToken.deployed();

  return KannaToken;
};

export const getKnnTokenMock = async (
  knnDeployerAddress: SignerWithAddress
) => {
  const KannaToken = await waffle.deployMockContract(knnDeployerAddress, KannaToken__factory.abi);

  return KannaToken;
};
