import { ethers, run } from "hardhat";
import getKnnToken from "../src/infrastructure/factories/KannaTokenFactory";
import {
  getKnnYield,
  getKnnYieldParameters,
} from "../src/infrastructure/factories/KannaYieldFactory";
import {
  getKnnPreSale,
  getPreSaleParameters,
} from "../src/infrastructure/factories/KannaPreSaleFactory";

import "@nomiclabs/hardhat-etherscan";
const sleep = (seconds: number) =>
  new Promise((resolve) => setTimeout(resolve, 1000 * seconds));

async function main() {
  const [deployerWallet] = await ethers.getSigners();
  const knnToken = await getKnnToken(deployerWallet);
  sleep(2);

  const knnYield = await getKnnYield(deployerWallet, knnToken);
  sleep(2);

  const knnPreSale = await getKnnPreSale(deployerWallet, knnToken);

  sleep(2);

  console.log(`knnToken: ${knnToken.address}\n`);
  await run("verify:verify", {
    address: knnToken.address,
    constructorArguments: [],
  });
  sleep(2);

  console.log(`knnYield: ${knnYield.address}\n`);
  await run("verify:verify", {
    address: knnYield.address,
    constructorArguments: getKnnYieldParameters(knnToken, deployerWallet),
  });
  sleep(2);

  console.log(`knnPreSale: ${knnPreSale.address}\n`);
  await run("verify:verify", {
    address: knnPreSale.address,
    constructorArguments: getPreSaleParameters(knnToken),
  });
  sleep(2);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
