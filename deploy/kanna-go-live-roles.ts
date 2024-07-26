import { ethers, run } from "hardhat";
import "@nomiclabs/hardhat-etherscan";
import { getKannaRoles } from "../src/infrastructure/factories";

const sleep = (seconds: number) =>
  new Promise((resolve) => setTimeout(resolve, 1000 * seconds));

async function main() {
  const [deployerWallet] = await ethers.getSigners();

  const kannaRoles = await getKannaRoles(deployerWallet);
  console.log(`kannaRoles: ${kannaRoles.address}\n`);
  sleep(20);

  await run("verify:verify", {
    address: kannaRoles.address,
    constructorArguments: [],
  });
  sleep(2);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
