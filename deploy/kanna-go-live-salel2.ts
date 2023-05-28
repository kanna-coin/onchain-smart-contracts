import { ethers, run } from 'hardhat';
import '@nomiclabs/hardhat-etherscan';
import {
  getKnnSaleL2,
  getSaleL2Parameters,
} from '../src/infrastructure/factories';

const sleep = (seconds: number) =>
  new Promise((resolve) => setTimeout(resolve, 1000 * seconds));

async function main() {
  const [deployerWallet] = await ethers.getSigners();

  const fxKnnToken: any = {
    address: process.env.FX_TOKEN_ADDRESS,
  };

  const knnSaleL2 = await getKnnSaleL2(deployerWallet, fxKnnToken);
  console.log(`knnSaleL2: ${knnSaleL2.address}\n`);
  sleep(2);

  await run('verify:verify', {
    address: knnSaleL2.address,
    constructorArguments: getSaleL2Parameters(fxKnnToken),
  });
  sleep(2);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
