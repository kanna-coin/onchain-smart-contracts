import { ethers } from "hardhat";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { KannaTreasurer, KannaToken } from "../../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { getKnnToken, getKnnTreasurer } from "../../src/infrastructure/factories";

chai.use(chaiAsPromised);
const { expect } = chai;

describe("KNN Treasurer", () => {
  let knnTreasurer: KannaTreasurer;
  let signers: SignerWithAddress[];
  let knnToken: KannaToken;

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
      const treasuryBalance = await knnToken.balanceOf(knnTreasurer.address);
      const balance = parseInt(treasuryBalance._hex, 16);

      expect(balance).to.greaterThanOrEqual(1e25);
    });

    it("should release balance to wallet", async () => {
      const [deployerWallet, wallet] = signers;

      const treasuryBalance = await knnToken.balanceOf(knnTreasurer.address);

      const amount = 1e9;

      const tx = knnTreasurer.release(wallet.address, amount);

      const releaseTransaction = await tx;

      releaseTransaction.timestamp;

      expect(tx).to.emit(knnTreasurer, "Release").withArgs(
        deployerWallet.address,
        wallet.address,
        amount,
        releaseTransaction.timestamp
      );

      const walletBalance = await knnToken.balanceOf(wallet.address);

      expect(walletBalance).to.eq(amount);

      const newTreasuryBalance = await knnToken.balanceOf(knnTreasurer.address);
      const expectedTreasuryBalance = treasuryBalance.sub(amount);

      expect(newTreasuryBalance).to.eq(expectedTreasuryBalance);
    });
  });
});
