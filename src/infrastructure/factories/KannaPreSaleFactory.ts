import "@nomiclabs/hardhat-waffle";
import { ethers } from "hardhat";
import {
  KannaPreSale__factory,
  KannaPreSale,
  KannaTreasurer,
  ERC20KannaToken,
} from "../../../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

const parse1e18 = (integer: number): string => `${integer}000000000000000000`;

const instance = async (
  knnDeployerAddress: SignerWithAddress,
  knnToken: ERC20KannaToken,
  knnTreasurer: KannaTreasurer
): Promise<KannaPreSale> => {
  let knnPreSale: KannaPreSale;

  const knnPreSaleFactory = (await ethers.getContractFactory(
    "KannaPreSale",
    knnDeployerAddress
  )) as KannaPreSale__factory;
  knnPreSale = await knnPreSaleFactory.deploy(knnToken.address);

  await knnPreSale.deployed();

  const preSaleAmount = parse1e18(50000);

  await knnToken.noTransferFee(knnPreSale.address);

  await knnTreasurer.release(knnPreSale.address, preSaleAmount);

  await knnPreSale.updateQuotation("1");

  return knnPreSale;
};

export default instance;
