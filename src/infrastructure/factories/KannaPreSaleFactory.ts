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

const preSaleAmount = parse1e18(350000);

const quotation = "50000000";

export const getPreSaleParameters = (
  knnToken: KannaToken
): [string, string, string] => {
  return [knnToken.address, process.env.PRICE_AGGREGATOR_ADDRESS!, quotation];
};

export const getKnnPreSale = async (
  knnDeployerAddress: SignerWithAddress,
  knnToken: KannaToken,
  knnTreasurer?: KannaTreasurer
): Promise<KannaPreSale> => {
  let knnPreSale: KannaPreSale;

  const parameters = getPreSaleParameters(knnToken);

  const knnPreSaleFactory = (await ethers.getContractFactory(
    "KannaPreSale",
    knnDeployerAddress
  )) as KannaPreSale__factory;
  knnPreSale = await knnPreSaleFactory.deploy(...parameters);

  await knnPreSale.deployed();

  if (knnTreasurer) {
    await knnTreasurer.release(knnPreSale.address, preSaleAmount);
  }

  return knnPreSale;
};
