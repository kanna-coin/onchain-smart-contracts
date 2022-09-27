import "@nomiclabs/hardhat-waffle";
import { ethers } from "hardhat";
import {
  KannaTreasurer__factory,
  KannaTreasurer,
  ERC20KannaToken,
} from "../../../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

const instance = async (
  knnDeployerAddress: SignerWithAddress,
  knnToken: ERC20KannaToken
): Promise<KannaTreasurer> => {
  let knnTreasurer: KannaTreasurer;

  const knnTreasurerFactory = (await ethers.getContractFactory(
    "KannaTreasurer",
    knnDeployerAddress
  )) as KannaTreasurer__factory;
  knnTreasurer = await knnTreasurerFactory.deploy(knnToken.address);

  await knnTreasurer.deployed();

  await knnToken.initializeTreasury(knnTreasurer.address);

  return knnTreasurer;
};

export default instance;
