import { ethers, run } from "hardhat";
import "@nomiclabs/hardhat-etherscan";
import {
  getKnnToken,
  getKnnYield,
  getKnnYieldParameters,
  getKnnPreSale,
  getPreSaleParameters,
} from "../src/infrastructure/factories";

const sleep = (seconds: number) =>
  new Promise((resolve) => setTimeout(resolve, 1000 * seconds));

async function main() {
  const [deployerWallet] = await ethers.getSigners();
  const knnToken = await getKnnToken(deployerWallet);
  console.log(`knnToken: ${knnToken.address}\n`);
  sleep(2);

  const knnYield = await getKnnYield(deployerWallet, knnToken);
  console.log(`knnYield: ${knnYield.address}\n`);
  sleep(2);

  const knnPreSale = await getKnnPreSale(deployerWallet, knnToken);
  console.log(`knnPreSale: ${knnPreSale.address}\n`);
  sleep(2);

  await run("verify:verify", {
    address: knnToken.address,
    constructorArguments: [],
  });
  sleep(2);

  await run("verify:verify", {
    address: knnYield.address,
    constructorArguments: getKnnYieldParameters(knnToken, deployerWallet),
  });
  sleep(2);

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
