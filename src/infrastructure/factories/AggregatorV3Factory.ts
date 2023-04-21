import "@nomiclabs/hardhat-waffle";
import { waffle } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import AggregatorV3InterfaceAbi from "@chainlink/contracts/abi/v0.8/AggregatorV3Interface.json";

export const getAggregatorMock = async (
  knnDeployerAddress: SignerWithAddress
) => {
  const priceAggregator = await waffle.deployMockContract(knnDeployerAddress, AggregatorV3InterfaceAbi);

  return priceAggregator;
};
