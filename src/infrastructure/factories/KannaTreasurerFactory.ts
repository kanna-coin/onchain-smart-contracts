import "@nomiclabs/hardhat-waffle";
import { ethers, waffle } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { MockContract } from "ethereum-waffle";
import {
  KannaTreasurer__factory,
  KannaTreasurer,
  KannaToken,
} from "../../../typechain";

export const getKnnTreasurer = async (
  knnDeployerAddress: SignerWithAddress,
  knnToken: KannaToken | MockContract
): Promise<KannaTreasurer> => {
  let knnTreasurer: KannaTreasurer;

  const knnTreasurerFactory = (await ethers.getContractFactory(
    "KannaTreasurer",
    knnDeployerAddress
  )) as KannaTreasurer__factory;
  knnTreasurer = await knnTreasurerFactory.deploy(knnToken.address);

  await knnTreasurer.deployed();

  await knnToken.updateTreasury(knnTreasurer.address);
  await knnToken.initializeTreasury();

  return knnTreasurer;
};

export const getKnnTreasurerMock = async (
  knnDeployerAddress: SignerWithAddress
) => {
  const knnTreasurer = await waffle.deployMockContract(knnDeployerAddress, KannaTreasurer__factory.abi);

  return knnTreasurer;
};