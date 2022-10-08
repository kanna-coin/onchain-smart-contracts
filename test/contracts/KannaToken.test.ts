import { ethers } from "hardhat";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { KannaToken } from "../../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import getKnnToken from "../../src/infrastructure/factories/KannaTokenFactory";
import getKnnTreasurer from "../../src/infrastructure/factories/KannaTreasurerFactory";

chai.use(chaiAsPromised);
const { expect } = chai;

const parse1e18 = (integer: number): string => `${integer}000000000000000000`;

const parseKNN = (bigNumberish: any): number =>
  parseInt(ethers.utils.formatEther(bigNumberish).split(".")[0], 10);

describe("KNN Token", () => {
  let knnToken: KannaToken;
  let signers: SignerWithAddress[];

  const deployContracts = async () => {
    signers = await ethers.getSigners();

    const [deployerAddress] = signers;

    knnToken = await getKnnToken(deployerAddress);
  };

  describe(".initializeTreasury", async () => {
    beforeEach(async () => {
      await deployContracts();
    });

    it("should initialize set and initialize amount to treasury", async () => {
      const [deployerWallet] = signers;
      const knnTreasurer = await getKnnTreasurer(deployerWallet, knnToken);

      const error = await knnToken
        .updateTreasury(knnTreasurer.address)
        .then(() => null)
        .catch((e) => e);

      expect(error).to.null;
    });

    it("should NOT allow initialization when treasury are no set", async () => {
      const [deployerWallet] = signers;
      const knnTreasurer = await getKnnTreasurer(deployerWallet, knnToken);

      const error = await knnToken
        .initializeTreasury()
        .then(() => null)
        .catch((e) => e);

      expect(error).to.not.null;
    });
  });

  // describe(".updateTransactionFee", async () => {
  //   beforeEach(async () => {
  //     await deployContracts();
  //   });

  //   it("should update a transfer to 20% and validate transfer value", async () => {
  //     await knnToken.updateTransferFee("200");

  //     const [deployerWallet, wallet1, wallet2] = signers;

  //     const knnTreasurer: KannaTreasurer = await getKnnTreasurer(
  //       deployerWallet,
  //       knnToken
  //     );

  //     await knnTreasurer.release(wallet1.address, parse1e18(20000));

  //     const scopedToken: KannaToken = (await ethers.getContractAt(
  //       "KannaToken",
  //       knnToken.address,
  //       wallet1
  //     )) as KannaToken;

  //     await scopedToken.transfer(wallet2.address, parse1e18(20000));

  //     const wallet2BalanceHex = await knnToken.balanceOf(wallet2.address);

  //     const balance = parseInt(wallet2BalanceHex._hex, 16);

  //     expect(balance).to.eq(1.96e22);
  //   });
  // });

  describe(".transferFrom", async () => {
    beforeEach(async () => {
      await deployContracts();
    });

    // it("should apply a transferFee for Approved transfers (transferFrom) outside KNN contracts", async () => {
    //   await knnToken.updateTransferFee("1");

    //   const [deployerWallet, wallet1, wallet2] = signers;

    //   const knnTreasurer: KannaTreasurer = await getKnnTreasurer(
    //     deployerWallet,
    //     knnToken
    //   );

    //   await knnTreasurer.release(wallet1.address, parse1e18(20000));

    //   const scopedWallet1Token: KannaToken = (await ethers.getContractAt(
    //     "KannaToken",
    //     knnToken.address,
    //     wallet1
    //   )) as KannaToken;

    //   await scopedWallet1Token.approve(wallet2.address, parse1e18(20000));

    //   const scopedWallet2Token: KannaToken = (await ethers.getContractAt(
    //     "KannaToken",
    //     knnToken.address,
    //     wallet2
    //   )) as KannaToken;

    //   await scopedWallet2Token.transferFrom(
    //     wallet1.address,
    //     wallet2.address,
    //     parse1e18(20000)
    //   );

    //   const wallet2BalanceHex = await knnToken.balanceOf(wallet2.address);

    //   const balance = parseInt(wallet2BalanceHex._hex, 16);

    //   expect(balance).to.eq(1.9998e22);
    // });
  });

  describe(".transfer", async () => {
    beforeEach(async () => {
      await deployContracts();
    });

    // it("should apply a transfer fee for transfers outside knn", async () => {
    //   await knnToken.updateTransferFee("200");

    //   const [deployerWallet, wallet1, wallet2] = signers;

    //   const knnTreasurer: KannaTreasurer = await getKnnTreasurer(
    //     deployerWallet,
    //     knnToken
    //   );

    //   await knnTreasurer.release(wallet1.address, parse1e18(20000));

    //   const scopedToken: KannaToken = (await ethers.getContractAt(
    //     "KannaToken",
    //     knnToken.address,
    //     wallet1
    //   )) as KannaToken;

    //   await scopedToken.transfer(wallet2.address, parse1e18(20000));

    //   const wallet2BalanceHex = await knnToken.balanceOf(wallet2.address);

    //   const balance = parseInt(wallet2BalanceHex._hex, 16);

    //   expect(balance).to.eq(1.96e22);
    // });
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

  // describe(".(add)/(remove) TransferFeeExempt", async () => {
  //   beforeEach(async () => {
  //     await deployContracts();
  //   });

  //   it("should NOT-apply-FEE for a transfer within a TRANSFER_FEE_EXEMPT granted wallet", async () => {
  //     await knnToken.updateTransferFee("500");

  //     const [deployerWallet, wallet1, wallet2] = signers;

  //     const knnTreasurer: KannaTreasurer = await getKnnTreasurer(
  //       deployerWallet,
  //       knnToken
  //     );

  //     await knnTreasurer.release(wallet1.address, parse1e18(20000));

  //     const scopedToken: KannaToken = (await ethers.getContractAt(
  //       "KannaToken",
  //       knnToken.address,
  //       wallet1
  //     )) as KannaToken;

  //     await knnToken.addTransferFeeExempt(wallet2.address);
  //     await scopedToken.transfer(wallet2.address, parse1e18(20000));

  //     const wallet2BalanceHex = await knnToken.balanceOf(wallet2.address);

  //     const balance = parseInt(wallet2BalanceHex._hex, 16);

  //     expect(balance).to.eq(2e22);
  //   });

  //   it("should apply FEE for a transfer with a TRANSFER_FEE_EXEMPT granted wallet", async () => {
  //     await knnToken.updateTransferFee("500");

  //     const [deployerWallet, wallet1, wallet2] = signers;

  //     const knnTreasurer: KannaTreasurer = await getKnnTreasurer(
  //       deployerWallet,
  //       knnToken
  //     );

  //     await knnTreasurer.release(wallet1.address, parse1e18(20000));

  //     const scopedToken: KannaToken = (await ethers.getContractAt(
  //       "KannaToken",
  //       knnToken.address,
  //       wallet1
  //     )) as KannaToken;

  //     await knnToken.removeTransferFeeExempt(wallet2.address);
  //     await knnToken.removeTransferFeeExempt(wallet1.address);
  //     await scopedToken.transfer(wallet2.address, parse1e18(20000));

  //     const wallet2BalanceHex = await knnToken.balanceOf(wallet2.address);

  //     const balance = parseInt(wallet2BalanceHex._hex, 16);

  //     expect(balance).to.eq(1.9e22);
  //   });
  // });

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

  describe(".removeMinter", async () => {
    beforeEach(async () => {
      await deployContracts();
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
        .mint(parse1e18(1))
        .then(() => null)
        .catch((e) => e);

      expect(result?.message).to.not.null;
    });
  });

  // describe(".updateTransferFeeRecipient", async () => {
  //   beforeEach(async () => {
  //     await deployContracts();
  //   });

  //   it("should update the transferFee recipient", async () => {
  //     const amount = 1500;
  //     const [deployerWallet, walletFrom, walletTo, newFeeReicipientWallet] =
  //       signers;
  //     await knnToken.updateTransferFeeRecipient(newFeeReicipientWallet.address);
  //     const knnTreasurer = await getKnnTreasurer(deployerWallet, knnToken);
  //     await knnTreasurer.release(walletFrom.address, parse1e18(amount));

  //     const scopedToken: KannaToken = (await ethers.getContractAt(
  //       "KannaToken",
  //       knnToken.address,
  //       walletFrom
  //     )) as KannaToken;

  //     await scopedToken.transfer(walletTo.address, parse1e18(amount));

  //     const toBalance = await knnToken.balanceOf(walletTo.address);
  //     const feeRecipientBalance = await knnToken.balanceOf(
  //       newFeeReicipientWallet.address
  //     );
  //     const receivedAmount = parseKNN(toBalance);
  //     const feeBalance = parseKNN(feeRecipientBalance);

  //     expect(amount * 0.99).to.eq(receivedAmount);
  //     expect(amount * 0.01).to.eq(feeBalance);
  //   });
  // });
});
