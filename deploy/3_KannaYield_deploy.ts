import { ethers } from "hardhat";

const treasurerContractName = "KannaTreasurer";
const tokenContractName = "ERC20KannaToken";
const yieldContractName = "KannaYield";

const initialLoad = "1500000000000000000000000";

async function main() {
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

  let yieldContract = await yieldFactory.deploy(
    treasurerContract.address,
    initialLoad
  );

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

  await treasurerContract.addYieldContract(yieldContract.address);
  await yieldContract.initialize();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
