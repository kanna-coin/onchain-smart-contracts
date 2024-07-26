import { ethers, run } from 'hardhat';
import '@nomiclabs/hardhat-etherscan';
import { getKannaStockOption } from '../src/infrastructure/factories';

const sleep = (seconds: number) =>
  new Promise((resolve) => setTimeout(resolve, 1000 * seconds));

async function main() {
  const [deployerWallet] = await ethers.getSigners();

  const knnSop = await getKannaStockOption(deployerWallet);
  console.log(`kannaSop: ${knnSop.address}\n`);
  await sleep(10);

  await run('verify:verify', {
    address: knnSop.address,
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
