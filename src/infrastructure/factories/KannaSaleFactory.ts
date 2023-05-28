import "@nomiclabs/hardhat-waffle";
import { ethers, network } from "hardhat";
import { MockContract } from "ethereum-waffle";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  KannaSale__factory,
  KannaSale,
  KannaToken,
} from "../../../typechain-types";

const parse1e18 = (integer: number): string => `${integer}000000000000000000`;

const saleAmount = parse1e18(100_000);

const defaultQuotation = "60000000";

export const getKnnSaleFactory = async (deployerAddress: SignerWithAddress) =>
  (await ethers.getContractFactory(
    "KannaSale",
    deployerAddress
  )) as KannaSale__factory;

export const getSaleParameters = (
  knnToken: KannaToken | MockContract,
  aggregatorAddress: string = network.config.priceAggregator!,
  quotation: string = defaultQuotation
): [string, string, string] => {
  return [knnToken.address, aggregatorAddress, quotation];
};

export const getKnnSale = async (
  knnDeployerAddress: SignerWithAddress,
  knnToken: KannaToken | MockContract,
  knnTreasurer?: KannaToken | MockContract,
  aggregatorAddress: string = network.config.priceAggregator!,
  quotation: string = defaultQuotation
): Promise<KannaSale> => {
  const parameters = getSaleParameters(knnToken, aggregatorAddress, quotation);

  const knnSaleFactory = await getKnnSaleFactory(knnDeployerAddress);

  const knnSale = await knnSaleFactory.deploy(...parameters);

  await knnSale.deployed();

  if (knnTreasurer) {
    await knnTreasurer.transfer(knnSale.address, saleAmount);
  }

  return knnSale;
};
