import "@nomiclabs/hardhat-waffle";
import { ethers } from "hardhat";
import {
  KannaPreSale__factory,
  KannaPreSale,
  KannaTreasurer,
  KannaToken,
} from "../../../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

const parse1e18 = (integer: number): string => `${integer}000000000000000000`;

const instance = async (
  knnDeployerAddress: SignerWithAddress,
  knnToken: KannaToken,
  knnTreasurer: KannaTreasurer
): Promise<KannaPreSale> => {
  let knnPreSale: KannaPreSale;

  const knnPreSaleFactory = (await ethers.getContractFactory(
    "KannaPreSale",
    knnDeployerAddress
  )) as KannaPreSale__factory;
  knnPreSale = await knnPreSaleFactory.deploy(knnToken.address);

  await knnPreSale.deployed();

  const preSaleAmount = parse1e18(350000);

  await knnToken.addTransferFeeExempt(knnPreSale.address);

  await knnTreasurer.release(knnPreSale.address, preSaleAmount);

  await knnPreSale.updateQuotation("1");
  await knnPreSale.updateAvailablity(true);

  return knnPreSale;
};

export default instance;
