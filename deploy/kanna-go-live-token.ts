import { ethers, run } from "hardhat";
import "@nomiclabs/hardhat-etherscan";
import { getKnnToken } from "../src/infrastructure/factories";

const sleep = (seconds: number) =>
  new Promise((resolve) => setTimeout(resolve, 1000 * seconds));

async function main() {
  const [deployerWallet] = await ethers.getSigners();

  const knnToken = await getKnnToken(deployerWallet);
  console.log(`knnToken: ${knnToken.address}\n`);
  sleep(2);

  await run("verify:verify", {
    address: knnToken.address,
    constructorArguments: [],
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
