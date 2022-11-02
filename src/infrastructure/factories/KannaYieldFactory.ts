import "@nomiclabs/hardhat-waffle";
import { ethers, waffle } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { MockContract } from "ethereum-waffle";
import {
  KannaTreasurer,
  KannaToken,
  KannaYield__factory,
  KannaYield,
} from "../../../typechain";

const parse1e18 = (integer: number): string => `${integer}000000000000000000`;

export const getKnnYieldParameters = (
  knnToken: KannaToken | MockContract,
  feeRecipient: SignerWithAddress
): [string, string] => {
  return [knnToken.address, feeRecipient.address];
};

export const getKnnYield = async (
  knnDeployerAddress: SignerWithAddress,
  knnToken: KannaToken | MockContract,
  knnTreasurer?: KannaTreasurer | MockContract
): Promise<KannaYield> => {
  let knnYield: KannaYield;

  const parameters = getKnnYieldParameters(knnToken, knnDeployerAddress);

  const knnYieldFactory = (await ethers.getContractFactory(
    "KannaYield",
    knnDeployerAddress
  )) as KannaYield__factory;
  knnYield = await knnYieldFactory.deploy(...parameters);

  await knnYield.deployed();

  const rewards = parse1e18(400000);

  if (knnTreasurer) {
    await knnTreasurer.release(knnYield.address, rewards);
  }

  return knnYield;
};

export const getKnnYieldMock = async (
  knnDeployerAddress: SignerWithAddress
) => {
  const knnYield = await waffle.deployMockContract(knnDeployerAddress, KannaYield__factory.abi);

  return knnYield;
};
