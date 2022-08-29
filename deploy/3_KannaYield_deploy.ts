import { config as dotEnvConfig } from "dotenv";
dotEnvConfig();

import { ethers } from "hardhat";

const treasurerContractName = "KannaTreasurer";
const tokenContractName = "ERC20KannaToken";
const yieldContractName = "KannaYield";

const decimals = new Array(18).fill("0").join("");
const initialLoad = "400000".concat(decimals);

async function main() {
  const deployerAddress = process.env.DEPLOYER_ADDRESS;

  const treasurerFactory = await ethers.getContractFactory(
    treasurerContractName
  );
  const tokenFactory = await ethers.getContractFactory(tokenContractName);
  const yieldFactory = await ethers.getContractFactory(yieldContractName);

  const tokenContract = await tokenFactory.deploy();

  console.log(`deploying ${tokenContractName}`);
  console.log(
    `[1] The address the ${tokenContractName} WILL have once mined: ${tokenContract.address}`
  );

  await tokenContract.deployed();
  console.log(`${tokenContractName} mined!`);

  let treasurerContract = await treasurerFactory.deploy(tokenContract.address);

  console.log(`deploying ${treasurerContractName}`);
  console.log(
    `[2] The address the ${treasurerContractName} WILL have once mined: ${treasurerContract.address}`
  );

  await treasurerContract.deployed();

  treasurerContract = await ethers.getContractAt(
    treasurerContractName,
    treasurerContract.address
  );

  console.log(`${treasurerContractName} mined!`);

  let yieldContract = await yieldFactory.deploy(treasurerContract.address);

  console.log(`deploying ${yieldContractName}`);
  console.log(
    `[3] The address the ${yieldContractName} WILL have once mined: ${yieldContract.address}`
  );

  await yieldContract.deployed();

  console.log(`${yieldContractName} mined!`);

  yieldContract = await ethers.getContractAt(
    yieldContractName,
    yieldContract.address
  );

  await tokenContract.approve(treasurerContract.address, initialLoad);
  await tokenContract.approve(yieldContract.address, initialLoad);
  await tokenContract.approve(deployerAddress, initialLoad);

  await treasurerContract.addYieldContract(yieldContract.address, initialLoad, {
    gasPrice: 100, // TODO: Entender REPLACEMENT_UNDERPRICED e como isso pode afetar o fluxo de DEPLOY. Isso pode ser um problema?
    gasLimit: 9000000,
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
