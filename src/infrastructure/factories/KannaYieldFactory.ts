import "@nomiclabs/hardhat-waffle";
import { ethers } from "hardhat";
import {
  KannaTreasurer__factory,
  KannaTreasurer,
  KannaToken,
  KannaYield__factory,
  KannaYield,
} from "../../../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

const parse1e18 = (integer: number): string => `${integer}000000000000000000`;

const instance = async (
  knnDeployerAddress: SignerWithAddress,
  knnToken: KannaToken,
  knnTreasurer: KannaTreasurer
): Promise<KannaYield> => {
  let knnYield: KannaYield;

  const knnYieldFactory = (await ethers.getContractFactory(
    "KannaYield",
    knnDeployerAddress
  )) as KannaYield__factory;
  knnYield = await knnYieldFactory.deploy(
    knnToken.address,
    knnDeployerAddress.address
  );

  await knnYield.deployed();

  const rewards = parse1e18(400000);

  await knnToken.noTransferFee(knnYield.address);
  await knnTreasurer.release(knnYield.address, rewards);

  return knnYield;
};

export default instance;
