import "@nomiclabs/hardhat-waffle";
import { ethers, waffle } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { MockContract } from "ethereum-waffle";
import {
  KannaToken,
  KannaYield__factory,
  KannaYield,
} from "../../../typechain-types";

const parse1e18 = (integer: number): string => `${integer}000000000000000000`;

export const getKnnYieldFactory = async (deployerAddress: SignerWithAddress) => (await ethers.getContractFactory(
  "KannaYield",
  deployerAddress
)) as KannaYield__factory;

export const getKnnYieldParameters = (
  knnToken: KannaToken | MockContract,
  feeRecipient: SignerWithAddress
): [string, string] => {
  return [knnToken.address, feeRecipient.address];
};

export const getKnnYield = async (
  knnDeployerAddress: SignerWithAddress,
  knnToken: KannaToken | MockContract,
  knnTreasurer?: KannaToken | MockContract
): Promise<KannaYield> => {
  const parameters = getKnnYieldParameters(knnToken, knnDeployerAddress);

  const knnYieldFactory = await getKnnYieldFactory(knnDeployerAddress);

  const knnYield = await knnYieldFactory.deploy(...parameters);

  await knnYield.deployed();

  const rewards = parse1e18(400000);

  if (knnTreasurer) {
    await knnTreasurer.transfer(knnYield.address, rewards);
  }

  return knnYield;
};

export const getKnnYieldMock = async (
  knnDeployerAddress: SignerWithAddress
) => {
  const knnYield = await waffle.deployMockContract(knnDeployerAddress, KannaYield__factory.abi);

  return knnYield;
};
