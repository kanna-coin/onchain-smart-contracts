import { ethers } from "hardhat";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { KannaTreasurer, ERC20KannaToken } from "../../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import getKnnToken from "../../src/infrastructure/factories/KannaTokenFactory";
import getKnnTreasurer from "../../src/infrastructure/factories/KannaTreasurerFactory";

chai.use(chaiAsPromised);
const { expect } = chai;

const parse1e18 = (integer: number): string => `${integer}000000000000000000`;

const parseKNN = (bigNumberish: any): number => {
  const parts = ethers.utils.formatEther(bigNumberish).split(".");
  return parseFloat(
    `${parseFloat(parts[0])}.${parseFloat(parts[1]).toFixed(2)}`
  );
};

let knnToken: ERC20KannaToken;
let signers: SignerWithAddress[];

const deployContracts = async () => {
  signers = await ethers.getSigners();

  const [deployerAddress] = signers;

  knnToken = await getKnnToken(deployerAddress);
};

describe("KNN Token", () => {
  describe(".initializeTreasury", async () => {
    beforeEach(async () => {
      await deployContracts();
    });

    it("should be idempotent", async () => {
      const [deployerWallet] = signers;
      const knnTreasurer = await getKnnTreasurer(deployerWallet, knnToken);

      // Idempotency assertion for further DAO treasury replacement
      await knnToken.initializeTreasury(knnTreasurer.address);
      await knnToken.initializeTreasury(knnTreasurer.address);
      await knnToken.initializeTreasury(knnTreasurer.address);

      const treasuryBalanceHex = await knnToken.balanceOf(knnTreasurer.address);

      const balance = parseInt(treasuryBalanceHex._hex, 16);

      expect(balance).to.greaterThanOrEqual(1e18);
    });
  });

  describe(".updateTransactionFee", async () => {
    beforeEach(async () => {
      await deployContracts();
    });

    it("should update a transaction to 20% and validate transfer value", async () => {
      await knnToken.updateTransactionFee("20000");

      const [deployerWallet, wallet1, wallet2] = signers;

      const knnTreasurer: KannaTreasurer = await getKnnTreasurer(
        deployerWallet,
        knnToken
      );

      await knnTreasurer.release(wallet1.address, parse1e18(20000));

      const scopedToken: ERC20KannaToken = (await ethers.getContractAt(
        "ERC20KannaToken",
        knnToken.address,
        wallet1
      )) as ERC20KannaToken;

      await scopedToken.transfer(wallet2.address, parse1e18(20000));

      const wallet2BalanceHex = await knnToken.balanceOf(wallet2.address);

      const balance = parseInt(wallet2BalanceHex._hex, 16);

      expect(balance).to.eq(1.6e22);
    });
  });

  describe(".transferFrom", async () => {
    beforeEach(async () => {
      await deployContracts();
    });

    it("should apply a transactionFee for Approved transfers (transferFrom) outside KNN contracts", async () => {
      await knnToken.updateTransactionFee("20000");

      const [deployerWallet, wallet1, wallet2] = signers;

      const knnTreasurer: KannaTreasurer = await getKnnTreasurer(
        deployerWallet,
        knnToken
      );

      await knnTreasurer.release(wallet1.address, parse1e18(20000));

      const scopedWallet1Token: ERC20KannaToken = (await ethers.getContractAt(
        "ERC20KannaToken",
        knnToken.address,
        wallet1
      )) as ERC20KannaToken;

      await scopedWallet1Token.approve(wallet2.address, parse1e18(20000));

      const scopedWallet2Token: ERC20KannaToken = (await ethers.getContractAt(
        "ERC20KannaToken",
        knnToken.address,
        wallet2
      )) as ERC20KannaToken;

      await scopedWallet2Token.transferFrom(
        wallet1.address,
        wallet2.address,
        parse1e18(20000)
      );

      const wallet2BalanceHex = await knnToken.balanceOf(wallet2.address);

      const balance = parseInt(wallet2BalanceHex._hex, 16);

      expect(balance).to.eq(1.6e22);
    });
  });

  describe(".transfer", async () => {
    beforeEach(async () => {
      await deployContracts();
    });

    it("should apply a transaction fee for transfers outside knn", async () => {
      await knnToken.updateTransactionFee("20000");

      const [deployerWallet, wallet1, wallet2] = signers;

      const knnTreasurer: KannaTreasurer = await getKnnTreasurer(
        deployerWallet,
        knnToken
      );

      await knnTreasurer.release(wallet1.address, parse1e18(20000));

      const scopedToken: ERC20KannaToken = (await ethers.getContractAt(
        "ERC20KannaToken",
        knnToken.address,
        wallet1
      )) as ERC20KannaToken;

      await scopedToken.transfer(wallet2.address, parse1e18(20000));

      const wallet2BalanceHex = await knnToken.balanceOf(wallet2.address);

      const balance = parseInt(wallet2BalanceHex._hex, 16);

      expect(balance).to.eq(1.6e22);
    });
  });

  describe(".mint", async () => {
    beforeEach(async () => {
      await deployContracts();
    });

    it("should mint directly to Treasury Contract", async () => {
      const [deployerWallet] = signers;
      const knnTreasurer = await getKnnTreasurer(deployerWallet, knnToken);

      const treasuryBalanceHexBefore = await knnToken.balanceOf(
        knnTreasurer.address
      );

      const balance1 = parseInt(treasuryBalanceHexBefore._hex, 16);

      expect(balance1).to.eq(1e25);

      await knnToken.addMinter(deployerWallet.address);

      // 0.5MM
      await knnToken.mint(parse1e18(500000));

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

      const result = await knnToken
        .mint(parse1e18(10500000))
        .then(() => null)
        .catch((e) => e);

      expect(result?.message).to.not.null;
    });
  });

  describe(".noTransferFee", async () => {
    beforeEach(async () => {
      await deployContracts();
    });

    it("should apply NO FEE for a transaction within a NO_TRANSFER_FEE granted wallet", async () => {
      await knnToken.updateTransactionFee("50000");

      const [deployerWallet, wallet1, wallet2] = signers;

      const knnTreasurer: KannaTreasurer = await getKnnTreasurer(
        deployerWallet,
        knnToken
      );

      await knnTreasurer.release(wallet1.address, parse1e18(20000));

      const scopedToken: ERC20KannaToken = (await ethers.getContractAt(
        "ERC20KannaToken",
        knnToken.address,
        wallet1
      )) as ERC20KannaToken;

      await knnToken.noTransferFee(wallet2.address);
      await scopedToken.transfer(wallet2.address, parse1e18(20000));

      const wallet2BalanceHex = await knnToken.balanceOf(wallet2.address);

      const balance = parseInt(wallet2BalanceHex._hex, 16);

      expect(balance).to.eq(2e22);
    });
  });

  describe(".addMinter", async () => {
    beforeEach(async () => {
      await deployContracts();
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
        .mint(parse1e18(1))
        .then(() => null)
        .catch((e) => e);

      expect(result?.message).to.not.null;
    });
  });
});
