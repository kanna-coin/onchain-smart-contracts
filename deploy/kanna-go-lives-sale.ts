import { ethers, run } from "hardhat";
import "@nomiclabs/hardhat-etherscan";
import { getKnnSale, getSaleParameters } from "../src/infrastructure/factories";

const sleep = (seconds: number) =>
  new Promise((resolve) => setTimeout(resolve, 1000 * seconds));

async function main() {
  const [deployerWallet] = await ethers.getSigners();

  const knnToken: any = {
    address: process.env.TOKEN_ADDRESS,
  };

  const knnSale = await getKnnSale(deployerWallet, knnToken);
  console.log(`knnSale: ${knnSale.address}\n`);
  sleep(2);

  await run("verify:verify", {
    address: knnSale.address,
    constructorArguments: getSaleParameters(knnToken),
  });
  sleep(2);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
