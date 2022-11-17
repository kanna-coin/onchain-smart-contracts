import "@nomiclabs/hardhat-waffle";
import { ethers, waffle } from "hardhat";
import { MockContract } from "ethereum-waffle";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import AggregatorV3InterfaceAbi from "@chainlink/contracts/abi/v0.8/AggregatorV3Interface.json";
import {
  KannaPreSale__factory,
  KannaPreSale,
  KannaTreasurer,
  KannaToken,
} from "../../../typechain";

const parse1e18 = (integer: number): string => `${integer}000000000000000000`;

const preSaleAmount = parse1e18(350_000);

const defaultQuotation = "50000000";

export const getKnnPreSaleFactory = async (deployerAddress: SignerWithAddress) => (await ethers.getContractFactory(
  "KannaPreSale",
  deployerAddress
)) as KannaPreSale__factory;

export const getPreSaleParameters = (
  knnToken: KannaToken | MockContract,
  aggregatorAddress: string = process.env.PRICE_AGGREGATOR_ADDRESS!,
  quotation: string = defaultQuotation
): [string, string, string] => {
  return [knnToken.address, aggregatorAddress, quotation];
};

export const getKnnPreSale = async (
  knnDeployerAddress: SignerWithAddress,
  knnToken: KannaToken | MockContract,
  knnTreasurer?: KannaTreasurer | MockContract,
  aggregatorAddress: string = process.env.PRICE_AGGREGATOR_ADDRESS!,
  quotation: string = defaultQuotation,
): Promise<KannaPreSale> => {
  const parameters = getPreSaleParameters(knnToken, aggregatorAddress, quotation);

  const knnPreSaleFactory = await getKnnPreSaleFactory(knnDeployerAddress);

  const knnPreSale = await knnPreSaleFactory.deploy(...parameters);

  await knnPreSale.deployed();

  if (knnTreasurer) {
    await knnTreasurer.release(knnPreSale.address, preSaleAmount);
  }

  return knnPreSale;
};

export const getAggregatorMock = async (
  knnDeployerAddress: SignerWithAddress
) => {
  const priceAggregator = await waffle.deployMockContract(knnDeployerAddress, AggregatorV3InterfaceAbi);

  return priceAggregator;
};

export const getKnnPreSaleMock = async (
  knnDeployerAddress: SignerWithAddress
) => {
  const knnPreSale = await waffle.deployMockContract(knnDeployerAddress, KannaPreSale__factory.abi);

  return knnPreSale;
};