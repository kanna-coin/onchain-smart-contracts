import { ethers } from "hardhat";
import { getKnnToken, getKnnTreasurer, getKnnYield } from "../src/infrastructure/factories";

async function main() {
  const [deployerWallet] = await ethers.getSigners();
  const knnToken = await getKnnToken(deployerWallet);
  const knnTreasurer = await getKnnTreasurer(knnToken);
  const knnYield = await getKnnYield(deployerWallet, knnToken, knnTreasurer);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
