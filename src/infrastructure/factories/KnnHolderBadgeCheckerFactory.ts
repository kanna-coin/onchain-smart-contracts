import "@nomiclabs/hardhat-waffle";
import { ethers } from "hardhat";
import { MockContract } from "ethereum-waffle";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  KnnHolderBadgeChecker__factory,
  KnnHolderBadgeChecker,
  KannaToken,
} from "../../../typechain-types";

export const getKnnHolderBadgeCheckerFactory = async (deployerAddress: SignerWithAddress) =>
  (await ethers.getContractFactory(
    "KnnHolderBadgeChecker",
    deployerAddress
  )) as KnnHolderBadgeChecker__factory;

export const getKnnHolderBadgeCheckerParameters = (
  knnToken: KannaToken | MockContract
): [string] => {
  return [knnToken.address];
};

export const getKnnHolderBadgeChecker = async (
  knnDeployerAddress: SignerWithAddress,
  knnToken: KannaToken | MockContract,
): Promise<KnnHolderBadgeChecker> => {
  const parameters = getKnnHolderBadgeCheckerParameters(knnToken);

  const holderCheckerFactory = await getKnnHolderBadgeCheckerFactory(knnDeployerAddress);

  const holderChecker = await holderCheckerFactory.deploy(...parameters);

  await holderChecker.deployed();

  return holderChecker;
};
