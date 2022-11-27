import { ethers } from "hardhat";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { KannaToken, KannaTreasurer } from "../../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import getKnnToken from "../../src/infrastructure/factories/KannaTokenFactory";
import getKnnTreasurer from "../../src/infrastructure/factories/KannaTreasurerFactory";

chai.use(chaiAsPromised);
const { expect } = chai;

const tokenContractName = "KannaToken";

describe("KNN Token", () => {
  let knnToken: KannaToken;
  let signers: SignerWithAddress[];

  const deployContracts = async () => {
    signers = await ethers.getSigners();

    const [deployerAddress] = signers;

    knnToken = await getKnnToken(deployerAddress);
  };

  describe("Treasury", async () => {
    beforeEach(async () => {
      await deployContracts();
    });

    it("should initialize set and initialize amount to treasury (KannaTreasurer UC)", async () => {
      const [deployerWallet] = signers;
      const knnTreasurer: KannaTreasurer = await getKnnTreasurer(
        deployerWallet,
        knnToken
      );

      const error = await knnToken
        .updateTreasury(knnTreasurer.address)
        .then(() => null)
        .catch((e) => e);

      expect(error).to.null;
    });

    it("should NOT allow initialization when treasury are no set", async () => {
      const [deployerWallet] = signers;

      const error = await knnToken
        .initializeTreasury()
        .then(() => null)
        .catch(({ message }) => message);

      expect(error).to.contain("Treasury not set");
    });

    it("should NOT allow initialization more than once", async () => {
      const [deployerWallet] = signers;

      await knnToken.updateTreasury(deployerWallet.address);
      const success = await knnToken.initializeTreasury();

      const { events } = await success.wait();

      const error = await knnToken
        .initializeTreasury()
        .then(() => null)
        .catch(({ message }) => message);

      expect(events![0].event).to.eq("Transfer");

      expect(error).to.contain("Treasury already initialized");
    });
  });

  describe("Transfer", async () => {
    beforeEach(async () => {
      await deployContracts();
    });

    it("should allow use of unified Minter and Treasury (Multisig/GnosisSafe UC)", async () => {
      const [deployerWallet, wallet1, wallet2] = signers;

      const amount = ethers.utils.parseEther("2000.0").toString();

      await knnToken.addMinter(deployerWallet.address);
      const treasuryAudit = await knnToken.updateTreasury(
        deployerWallet.address
      );

      const { events } = await treasuryAudit.wait();
      await knnToken.initializeTreasury();
      await knnToken.mint(amount);
      await knnToken.transfer(wallet1.address, amount);

      const scopedToken: KannaToken = (await ethers.getContractAt(
        tokenContractName,
        knnToken.address,
        wallet1
      )) as KannaToken;

      await scopedToken.transfer(wallet2.address, amount);

      const wallet2Balance = await knnToken.balanceOf(wallet2.address);

      expect(wallet2Balance.toString()).to.eq(amount);
      expect(events![0].event).to.eq("TreasuryUpdate");
    });
  });

  describe("Mint", async () => {
    beforeEach(async () => {
      await deployContracts();
    });

    it("should mint directly to a defined treasury account (compliant GnosisSafe<>KannaTreasurer UC)", async () => {
      const [deployerWallet] = signers;
      const knnTreasurer = await getKnnTreasurer(deployerWallet, knnToken);

      const treasuryBalanceHexBefore = await knnToken.balanceOf(
        knnTreasurer.address
      );

      const balance1 = parseInt(treasuryBalanceHexBefore._hex, 16);

      expect(balance1).to.eq(1e25);

      await knnToken.addMinter(deployerWallet.address);

      // 0.5MM
      await knnToken.mint(ethers.utils.parseEther("500000.0").toString());

      const treasuryBalanceHexAfter = await knnToken.balanceOf(
        knnTreasurer.address
      );

      const balance2 = parseInt(treasuryBalanceHexAfter._hex, 16);

      // 10.5MM
      expect(balance2).to.eq(1.05e25);
    });

    it("should limit max supply to 19MM Tokens", async () => {
      const [deployerWallet] = signers;
      const knnTreasurer = await getKnnTreasurer(deployerWallet, knnToken);

      const treasuryBalanceHexBefore = await knnToken.balanceOf(
        knnTreasurer.address
      );

      const balance1 = parseInt(treasuryBalanceHexBefore._hex, 16);

      expect(balance1).to.eq(1e25);

      await knnToken.addMinter(deployerWallet.address);

      const response = await knnToken
        .mint(ethers.utils.parseEther("10500000.0").toString())
        .then(() => null)
        .catch(({ message }) => message);

      expect(response).to.contain("Maximum Supply reached");
    });

    it("should prevent minting when MINTER_ROLE not present", async () => {
      const [deployerWallet] = signers;
      const knnTreasurer = await getKnnTreasurer(deployerWallet, knnToken);

      const treasuryBalanceHexBefore = await knnToken.balanceOf(
        knnTreasurer.address
      );

      const balance1 = parseInt(treasuryBalanceHexBefore._hex, 16);

      expect(balance1).to.eq(1e25);

      await knnToken.removeMinter(deployerWallet.address);

      const result = await knnToken
        .mint(ethers.utils.parseEther("1.0").toString())
        .then(() => null)
        .catch((e) => e);

      expect(result?.message).to.not.null;
    });

    it("should prevent minting when not a MINTER", async () => {
      const [deployerWallet] = signers;
      const knnTreasurer = await getKnnTreasurer(deployerWallet, knnToken);

      const treasuryBalanceHexBefore = await knnToken.balanceOf(
        knnTreasurer.address
      );

      const balance1 = parseInt(treasuryBalanceHexBefore._hex, 16);

      expect(balance1).to.eq(1e25);

      const result = await knnToken
        .mint(ethers.utils.parseEther("1.0").toString())
        .then(() => null)
        .catch((e) => e);

      expect(result?.message).to.not.null;
    });
  });
});
