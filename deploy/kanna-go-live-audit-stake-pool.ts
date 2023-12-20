import { ethers, run } from "hardhat";
import "@nomiclabs/hardhat-etherscan";
import { getKannaAuditStakePool } from "../src/infrastructure/factories";

const sleep = (seconds: number) =>
  new Promise((resolve) => setTimeout(resolve, 1000 * seconds));

async function main() {
  const [deployerWallet] = await ethers.getSigners();

  const auditStakePool = await getKannaAuditStakePool(deployerWallet);
  console.log(`auditStakePool: ${auditStakePool.address}\n`);
  await sleep(20);

  await run("verify:verify", {
    address: auditStakePool.address,
    constructorArguments: [],
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
