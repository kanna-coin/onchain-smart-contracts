import "@nomiclabs/hardhat-waffle";
import { ethers } from "hardhat";
import {
  KannaTreasurer,
  KannaToken,
  KannaYield__factory,
  KannaYield,
} from "../../../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

const parse1e18 = (integer: number): string => `${integer}000000000000000000`;

export const getKnnYieldParameters = (
  knnToken: KannaToken,
  feeRecipient: SignerWithAddress
): [string, string] => {
  return [knnToken.address, feeRecipient.address];
};

export const getKnnYield = async (
  knnDeployerAddress: SignerWithAddress,
  knnToken: KannaToken,
  knnTreasurer?: KannaTreasurer
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
