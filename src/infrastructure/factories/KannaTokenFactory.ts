import "@nomiclabs/hardhat-waffle";
import { ethers } from "hardhat";
import { KannaToken__factory, KannaToken } from "../../../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

const instance = async (
  knnDeployerAddress: SignerWithAddress
): Promise<KannaToken> => {
  let KannaToken: KannaToken;

  const KannaTokenFactory = (await ethers.getContractFactory(
    "KannaToken",
    knnDeployerAddress
  )) as KannaToken__factory;
  KannaToken = await KannaTokenFactory.deploy(knnDeployerAddress.address);

  await KannaToken.deployed();

  return KannaToken;
};

export default instance;
