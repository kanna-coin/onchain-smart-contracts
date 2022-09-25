import { ethers } from "hardhat";
import getKnnToken from "../src/infrastructure/factories/KannaTokenFactory";
import getKnnTreasurer from "../src/infrastructure/factories/KannaTreasurerFactory";
import getKnnYield from "../src/infrastructure/factories/KannaYieldFactory";

async function main() {
  const [deployerWallet] = await ethers.getSigners();
  const knnToken = await getKnnToken(deployerWallet);
  const knnTreasurer = await getKnnTreasurer(deployerWallet, knnToken);
  const knnYield = await getKnnYield(deployerWallet, knnToken, knnTreasurer);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
