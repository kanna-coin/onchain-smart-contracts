import { ethers, run } from 'hardhat';
import '@nomiclabs/hardhat-etherscan';
import { getKannaStockOptionManager } from '../src/infrastructure/factories';

const sleep = (seconds: number) =>
  new Promise((resolve) => setTimeout(resolve, 1000 * seconds));

async function main() {
  const [deployerWallet] = await ethers.getSigners();

  const knnSopManager = await getKannaStockOptionManager(deployerWallet);
  console.log(`kannaSopManager: ${knnSopManager.address}\n`);
  sleep(10);

  await run('verify:verify', {
    address: knnSopManager.address,
  });
  sleep(10);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
