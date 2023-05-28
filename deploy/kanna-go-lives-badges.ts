import { ethers, run } from "hardhat";
import "@nomiclabs/hardhat-etherscan";
import { getKannaBadges, getKannaBadgesParameters } from "../src/infrastructure/factories";

const sleep = (seconds: number) =>
  new Promise((resolve) => setTimeout(resolve, 1000 * seconds));

async function main() {
  const [deployerWallet] = await ethers.getSigners();

  const uri = 'https://nft-dev.kannacoin.io/{id}.json';

  const kannaBadges = await getKannaBadges(deployerWallet, uri);
  console.log(`kannaBadges: ${kannaBadges.address}\n`);
  sleep(2);

  await run("verify:verify", {
    address: kannaBadges.address,
    constructorArguments: getKannaBadgesParameters(uri),
  });
  sleep(2);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
