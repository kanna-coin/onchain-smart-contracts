import { ethers, run } from "hardhat";
import "@nomiclabs/hardhat-etherscan";
import { getKannaBadgesL2, getKannaBadgesL2Parameters } from "../src/infrastructure/factories";

const sleep = (seconds: number) =>
  new Promise((resolve) => setTimeout(resolve, 1000 * seconds));

async function main() {
  const [deployerWallet] = await ethers.getSigners();

  const uri = 'https://nft-dev.kannacoin.io/{id}.json';

  const kannaBadges = await getKannaBadgesL2(deployerWallet, uri);
  console.log(`kannaBadgesL2: ${kannaBadges.address}\n`);
  sleep(30);

  await run("verify:verify", {
    address: kannaBadges.address,
    constructorArguments: getKannaBadgesL2Parameters(uri),
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
