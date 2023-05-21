import "@nomiclabs/hardhat-waffle";
import { ethers, waffle, network } from "hardhat";
import { MockContract } from "ethereum-waffle";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  KannaPreSale__factory,
  KannaPreSale,
  KannaToken,
} from "../../../typechain-types";

const parse1e18 = (integer: number): string => `${integer}000000000000000000`;

const preSaleAmount = parse1e18(350_000);

const defaultQuotation = "50000000";

export const getKnnPreSaleFactory = async (deployerAddress: SignerWithAddress) => (await ethers.getContractFactory(
  "KannaPreSale",
  deployerAddress
)) as KannaPreSale__factory;

export const getPreSaleParameters = (
  knnToken: KannaToken | MockContract,
  aggregatorAddress: string = network.config.priceAggregator!,
  quotation: string = defaultQuotation
): [string, string, string] => {
  return [knnToken.address, aggregatorAddress, quotation];
};

export const getKnnPreSale = async (
  knnDeployerAddress: SignerWithAddress,
  knnToken: KannaToken | MockContract,
  knnTreasurer?: KannaToken | MockContract,
  aggregatorAddress: string = network.config.priceAggregator!,
  quotation: string = defaultQuotation,
): Promise<KannaPreSale> => {
  const parameters = getPreSaleParameters(knnToken, aggregatorAddress, quotation);

  const knnPreSaleFactory = await getKnnPreSaleFactory(knnDeployerAddress);

  const knnPreSale = await knnPreSaleFactory.deploy(...parameters);

  await knnPreSale.deployed();

  if (knnTreasurer) {
    await knnTreasurer.transfer(knnPreSale.address, preSaleAmount);
  }

  return knnPreSale;
};

export const getKnnPreSaleMock = async (
  knnDeployerAddress: SignerWithAddress
) => {
  const knnPreSale = await waffle.deployMockContract(knnDeployerAddress, KannaPreSale__factory.abi);

  return knnPreSale;
};