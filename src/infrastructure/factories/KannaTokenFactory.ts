import "@nomiclabs/hardhat-waffle";
import { ethers } from "hardhat";
import {
  KannaTreasurer__factory,
  KannaTreasurer,
  ERC20KannaToken__factory,
  ERC20KannaToken,
} from "../../../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

const instance = async (
  knnDeployerAddress: SignerWithAddress
): Promise<ERC20KannaToken> => {
  let erc20KannaToken: ERC20KannaToken;

  const erc20kannaTokenFactory = (await ethers.getContractFactory(
    "ERC20KannaToken",
    knnDeployerAddress
  )) as ERC20KannaToken__factory;
  erc20KannaToken = await erc20kannaTokenFactory.deploy(
    knnDeployerAddress.address
  );

  await erc20KannaToken.deployed();

  return erc20KannaToken;
};

export default instance;
