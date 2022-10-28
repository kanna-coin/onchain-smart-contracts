import { ethers } from "hardhat";
import { getKnnToken, getKnnTreasurer } from "../src/infrastructure/factories";

async function main() {
  const [deployerWallet] = await ethers.getSigners();
  const knnToken = await getKnnToken(deployerWallet);
  const knnTreasurer = await getKnnTreasurer(deployerWallet, knnToken);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
