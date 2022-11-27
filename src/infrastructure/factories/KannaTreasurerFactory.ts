import "@nomiclabs/hardhat-waffle";
import { ethers } from "hardhat";
import {
  KannaTreasurer__factory,
  KannaTreasurer,
  KannaToken,
} from "../../../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

const instance = async (
  knnDeployerAddress: SignerWithAddress,
  knnToken: KannaToken
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

export default instance;
