import { ethers, run } from "hardhat";
import "@nomiclabs/hardhat-etherscan";
import { getKnnHolderBadgeChecker, getKnnHolderBadgeCheckerParameters } from "../src/infrastructure/factories";

const sleep = (seconds: number) =>
  new Promise((resolve) => setTimeout(resolve, 1000 * seconds));

async function main() {
  const [deployerWallet] = await ethers.getSigners();

  const knnToken: any = {
    address: process.env.TOKEN_ADDRESS,
  };

  /* const holderChecker = await getKnnHolderBadgeChecker(deployerWallet, knnToken);
  console.log(`holder checker: ${holderChecker.address}\n`);
  sleep(5); */

  await run("verify:verify", {
    // address: holderChecker.address,
    address: '0x0cae2ae14F5525EF6F71f7E90e2abe62c48C6EAC',
    constructorArguments: getKnnHolderBadgeCheckerParameters(knnToken),
  });
  sleep(2);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
