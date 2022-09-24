import { ethers } from "hardhat";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import {
  KannaTreasurer__factory,
  KannaTreasurer,
  ERC20KannaToken,
  ERC20KannaToken__factory,
} from "../../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

chai.use(chaiAsPromised);
const { expect } = chai;

const parseKNN = (bigNumberish: any): number =>
  parseInt(ethers.utils.formatEther(bigNumberish).split(".")[0], 10);

const parse1e18 = (integer: number): string => `${integer}000000000000000000`;

describe("KNN Treasurer", () => {
  let knnTreasurer: KannaTreasurer;
  let signers: SignerWithAddress[];
  let knnToken: ERC20KannaToken;

  const deployContracts = async () => {
    signers = await ethers.getSigners();

    const [deployerWallet] = signers;

    const tokenFactory = (await ethers.getContractFactory(
      "ERC20KannaToken",
      deployerWallet
    )) as ERC20KannaToken__factory;

    knnToken = await tokenFactory.deploy(deployerWallet.address);
    await knnToken.deployed();

    const treasurerFactory = (await ethers.getContractFactory(
      "KannaTreasurer",
      deployerWallet
    )) as KannaTreasurer__factory;

    knnTreasurer = await treasurerFactory.deploy(knnToken.address);

    await knnTreasurer.deployed();
  };

  describe("Setup", async () => {
    beforeEach(async () => {
      await deployContracts();
    });

    it("should initialize KNN Treasurer with initialSupply of 10MM", async () => {
      await knnToken.initializeTreasury(knnTreasurer.address);
      const treasuryBalanceHex = await knnToken.balanceOf(knnTreasurer.address);
      const balance = parseInt(treasuryBalanceHex._hex, 16);

      expect(balance).to.greaterThanOrEqual(1e25);
    });
  });
});
