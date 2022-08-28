import { ethers } from "hardhat";

const treasurerContractName = "KannaTreasurer";
const tokenContractName = "ERC20KannaToken";

async function main() {
  const treasurerFactory = await ethers.getContractFactory(
    treasurerContractName
  );
  const tokenFactory = await ethers.getContractFactory(tokenContractName);

  const tokenContract = await tokenFactory.deploy();

  console.log(`deploying ${tokenContractName}`);
  console.log(
    `[1] The address the ${tokenContractName} WILL have once mined: ${tokenContract.address}`
  );

  await tokenContract.deployed();
  console.log(`${tokenContractName} mined!`);

  const treasurerContract = await treasurerFactory.deploy(
    tokenContract.address
  );

  console.log(`deploying ${treasurerContractName}`);
  console.log(
    `[2] The address the ${treasurerContractName} WILL have once mined: ${treasurerContract.address}`
  );

  await treasurerContract.deployed();

  console.log(`${treasurerContractName} mined!`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
