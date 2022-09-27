import { ethers } from "hardhat";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { KannaTreasurer, ERC20KannaToken } from "../../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import getKnnToken from "../../src/infrastructure/factories/KannaTokenFactory";
import getKnnTreasurer from "../../src/infrastructure/factories/KannaTreasurerFactory";

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

    knnToken = await getKnnToken(deployerWallet);

    knnTreasurer = await getKnnTreasurer(deployerWallet, knnToken);
  };

  describe("Setup", async () => {
    beforeEach(async () => {
      await deployContracts();
    });

    it("should initialize KNN Treasurer with initialSupply of 10MM", async () => {
      const treasuryBalanceHex = await knnToken.balanceOf(knnTreasurer.address);
      const balance = parseInt(treasuryBalanceHex._hex, 16);

      expect(balance).to.greaterThanOrEqual(1e25);
    });
  });
});
