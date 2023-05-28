import "@nomiclabs/hardhat-waffle";
import { waffle } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import { DynamicBadgeChecker__factory } from "../../../typechain-types";

export const getDynamicBadgeCheckerMock = async (
  knnDeployerAddress: SignerWithAddress,
) => {
  const DynamicBadgeChecker = await waffle.deployMockContract(knnDeployerAddress, [...DynamicBadgeChecker__factory.abi]);

  await DynamicBadgeChecker.mock.supportsInterface.returns(true);

  return DynamicBadgeChecker;
};
