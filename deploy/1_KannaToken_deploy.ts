import { ethers } from "hardhat";
import getKnnToken from "../src/infrastructure/factories/KannaTokenFactory";

async function main() {
  const [deployerWallet] = await ethers.getSigners();
  const knnToken = await getKnnToken(deployerWallet);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
