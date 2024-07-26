import { ethers, run, network } from "hardhat";
import "@nomiclabs/hardhat-etherscan";
import { getKnnYield, getKnnYieldParameters, getKnnToken } from "../src/infrastructure/factories";

const sleep = (seconds: number) =>
  new Promise((resolve) => setTimeout(resolve, 1000 * seconds));

const getKnnTokenAddress = async () => {
  if (network.config.tokenAddress) {
    return network.config.tokenAddress;
  }

  const [deployerWallet] = await ethers.getSigners();

  const knnToken = await getKnnToken(deployerWallet);
  console.log(`knnToken: ${knnToken.address}\n`);
  await sleep(2);

  await run("verify:verify", {
    address: knnToken.address,
    constructorArguments: [],
  });

  return knnToken.address;
};

async function main() {
  const [deployerWallet] = await ethers.getSigners();

  const tokenAddress = await getKnnTokenAddress();

  const knnToken: any = {
    address: tokenAddress,
  };

  const knnYield = await getKnnYield(deployerWallet, knnToken);
  console.log(`knnYield: ${knnYield.address}\n`);
  sleep(2);

  await run("verify:verify", {
    address: knnYield.address,
    constructorArguments: getKnnYieldParameters(knnToken, deployerWallet),
  });
  sleep(2);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
