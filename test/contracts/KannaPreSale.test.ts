import { ethers, network } from "hardhat";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { KannaTreasurer, KannaToken, KannaPreSale } from "../../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import getKnnToken from "../../src/infrastructure/factories/KannaTokenFactory";
import getKnnTreasurer from "../../src/infrastructure/factories/KannaTreasurerFactory";
import { getKnnPreSale } from "../../src/infrastructure/factories/KannaPreSaleFactory";

chai.use(chaiAsPromised);
const { expect } = chai;

const ref = "ref";

describe("KNN PreSale", () => {
  let signers: SignerWithAddress[];
  let knnToken: KannaToken;
  let knnTreasurer: KannaTreasurer;
  let knnPreSale: KannaPreSale;

  const deployContracts = async () => {
    signers = await ethers.getSigners();

    const [deployerWallet] = signers;

    knnToken = await getKnnToken(deployerWallet);

    knnTreasurer = await getKnnTreasurer(deployerWallet, knnToken);

    knnPreSale = await getKnnPreSale(deployerWallet, knnToken, knnTreasurer);
  };

  const getDeployerWallet = async () => {
    const [deployerWallet] = signers;

    return deployerWallet;
  };

  const getUserWallet = async () => {
    const [, , userAccount] = signers;

    return userAccount;
  };

  const getManagerSession = async (): Promise<[SignerWithAddress, KannaPreSale]> => {
    const [, managerWallet] = signers;

    await knnPreSale.addClaimManager(managerWallet.address);

    const managerSession = await ethers.getContractAt(
      "KannaPreSale",
      knnPreSale.address,
      managerWallet
    ) as KannaPreSale;

    return [managerWallet, managerSession];
  };

  describe("Setup", async () => {
    beforeEach(async () => {
      await deployContracts();
    });

    it("should initialize KNN PreSale with amount of 50K tokens", async () => {
      const tokensToSell = await knnToken.balanceOf(knnPreSale.address);
      const balance = parseInt(tokensToSell._hex, 16);

      expect(balance).to.greaterThanOrEqual(5e22);
    });

    it("should convert ETH to KNN", async () => {
      const [total, quotation] = await knnPreSale.convertToKNN(
        ethers.utils.parseEther("1")
      );

      expect(parseFloat(ethers.utils.formatEther(total))).to.greaterThan(2000);
      expect(parseInt(quotation.toHexString(), 16)).to.greaterThan(1000 * 1e8);
    });

    it("should buy KNN tokens", async () => {
      const deployerWallet = await getDeployerWallet();

      await network.provider.send("hardhat_setBalance", [
        deployerWallet.address,
        "0xFFFFFFFFFFFFFFFF",
      ]);
      await network.provider.send("evm_mine");

      const eth = ethers.utils.parseEther("5.001001999238");

      const knnPriceInUSD = await knnPreSale.knnPriceInUSD();
      const [amountInKNN, ethPriceInUSD] = await knnPreSale.convertToKNN(eth);


      await expect(knnPreSale.buyTokens({ value: eth }))
        .to.emit(knnPreSale, 'Purchase').withArgs(
          deployerWallet.address,
          eth,
          knnPriceInUSD,
          ethPriceInUSD,
          amountInKNN
        );

      const tokensToSell = await knnToken.balanceOf(knnPreSale.address);
      const balance = parseInt(tokensToSell._hex, 16);

      expect(balance).to.lessThan(3.5e23);
    });

    describe("should not buy KNN tokens", async () => {
      it("when presale is unavailable", async () => {
        const deployerWallet = await getDeployerWallet();

        await network.provider.send("hardhat_setBalance", [
          deployerWallet.address,
          "0xFFFFFFFFFFFFFFFF",
        ]);
        await network.provider.send("evm_mine");

        await knnPreSale.updateAvailablity(false);

        const options = { value: ethers.utils.parseEther("1") };

        const error = await knnPreSale
          .buyTokens(options)
          .then(() => null)
          .catch((e) => e);

        expect(error).to.not.null;
      });

      it("when amount is greater than contract balance", async () => {
        const deployerWallet = await getDeployerWallet();

        await network.provider.send("hardhat_setBalance", [
          deployerWallet.address,
          "0xFFFFFFFFFFFFFFFF",
        ]);
        await network.provider.send("evm_mine");

        const balance = await knnToken.balanceOf(knnPreSale.address);

        const [balanceInWei] = await knnPreSale.convertToWEI(balance);

        const options = { value: balanceInWei.add(1e2) };

        const error = await knnPreSale
          .buyTokens(options)
          .then(() => null)
          .catch((e) => e);

        expect(error).to.not.null;
      });

      it("when amount is greater than available supply", async () => {
        const deployerWallet = await getDeployerWallet();
        const [, managerSession] = await getManagerSession();

        await network.provider.send("hardhat_setBalance", [
          deployerWallet.address,
          "0xFFFFFFFFFFFFFFFF",
        ]);
        await network.provider.send("evm_mine");

        await managerSession.lockSupply(1e10, ref);

        const balance = await knnToken.balanceOf(knnPreSale.address);
        const [balanceInWei] = await knnPreSale.convertToWEI(balance);

        const options = { value: balanceInWei };

        const error = await knnPreSale
          .buyTokens(options)
          .then(() => null)
          .catch((e) => e);

        expect(error).to.not.null;
      });
    });

    it("should update quotation", async () => {
      const deployerWallet = await getDeployerWallet();

      const currentPriceHex = await knnPreSale.knnPriceInUSD();

      const quotation = 5 * 1e8;
      await expect(knnPreSale.updateQuotation(quotation))
        .to.emit(knnPreSale, 'QuotationUpdate').withArgs(deployerWallet.address, currentPriceHex, quotation);

      const newPriceHex = await knnPreSale.knnPriceInUSD();

      const currentPrice = parseInt(currentPriceHex._hex, 16);
      const newPrice = parseInt(newPriceHex._hex, 16);

      expect(currentPrice).to.lessThan(newPrice);
    });

    it("should lock supply", async () => {
      const [, managerSession] = await getManagerSession();

      const balance = await knnToken.balanceOf(knnPreSale.address);

      const toLock = 1e10;

      await expect(managerSession.lockSupply(toLock, ref))
        .to.emit(managerSession, 'Lock').withArgs(ref, toLock);

      let availableSupply = await knnPreSale.availableSupply();

      let expectedSupply = balance.sub(toLock);

      expect(availableSupply).to.eq(expectedSupply);

      await expect(managerSession.lockSupply(toLock, ref))
        .to.emit(managerSession, 'Lock').withArgs(ref, toLock);

      availableSupply = await knnPreSale.availableSupply();

      expectedSupply = expectedSupply.sub(toLock);

      expect(availableSupply).to.eq(expectedSupply);
    });

    it("should not lock supply greater than supply", async () => {
      const [, managerSession] = await getManagerSession();

      const availableSupply = await knnPreSale.availableSupply();

      const toLock = availableSupply.add(1);

      const error = await managerSession
        .lockSupply(toLock, ref)
        .then(() => null)
        .catch((e) => e);

      expect(error).to.not.null;
    });

    it("should unlock supply", async () => {
      const [, managerSession] = await getManagerSession();

      const balance = await knnToken.balanceOf(knnPreSale.address);

      const toLock = 1e10;

      await managerSession.lockSupply(toLock, ref);

      let expectedSupply = balance.sub(toLock);

      const firstUnlock = 1e9;

      await expect(managerSession.unlockSupply(firstUnlock, ref))
        .to.emit(managerSession, 'Unlock').withArgs(ref, firstUnlock);

      expectedSupply = expectedSupply.add(firstUnlock);

      let availableSupply = await knnPreSale.availableSupply();

      expect(availableSupply).to.eq(expectedSupply);

      const secondUnlock = 5 * 1e9;

      await expect(managerSession.unlockSupply(secondUnlock, ref))
        .to.emit(managerSession, 'Unlock').withArgs(ref, secondUnlock);

      expectedSupply = expectedSupply.add(secondUnlock);

      availableSupply = await knnPreSale.availableSupply();

      expect(availableSupply).to.eq(expectedSupply);
    });

    it("should not unlock supply greater than locked", async () => {
      const [, managerSession] = await getManagerSession();
      const toLock = 1e10;
      const toUnlock = toLock + 1;

      await managerSession.lockSupply(toLock, ref);

      const error = await managerSession
        .unlockSupply(toUnlock, ref)
        .then(() => null)
        .catch((e) => e);

      expect(error).to.not.null;
    });

    it("should revert the receive function", async () => {
      const deployerWallet = await getDeployerWallet();

      await network.provider.send("hardhat_setBalance", [
        deployerWallet.address,
        "0xFFFFFFFFFFFFFFFF",
      ]);
      await network.provider.send("evm_mine");

      const tx = deployerWallet.sendTransaction({
        to: knnPreSale.address,
        value: ethers.utils.parseEther("5.001001999238"),
      });

      await expect(tx).to.be.reverted;
    });

    it("should invoke the fallback function", async () => {
      const deployerWallet = await getDeployerWallet();

      const nonExistentFuncSignature = "nonExistentFunc(uint256,uint256)";
      const fakeDemoContract = new ethers.Contract(
        knnPreSale.address,
        [
          ...knnPreSale.interface.fragments,
          `function ${nonExistentFuncSignature}`,
        ],
        deployerWallet
      );

      const tx = fakeDemoContract[nonExistentFuncSignature](8, 9);

      await expect(tx).to.be.reverted;
    });

    it("should allow claim", async () => {
      const [deployerWallet, claimManagerAccount, userAccount] = signers;
      const amount = 1;

      await knnPreSale.addClaimManager(deployerWallet.address);

      await knnPreSale.lockSupply(amount, ref);
      await knnPreSale.addClaimManager(claimManagerAccount.address);

      const managerSession = await ethers.getContractAt(
        "KannaPreSale",
        knnPreSale.address,
        claimManagerAccount
      );

      await expect(managerSession.claim(userAccount.address, amount, ref))
        .to.emit(managerSession, 'Claim').withArgs(userAccount.address, ref, amount);

      const balanceUint256 = await knnToken.balanceOf(userAccount.address);
      const balance = parseInt(balanceUint256._hex, 16);

      expect(balance).to.eq(amount);
    });

    it("should validate claimable amount", async () => {
      const [, claimManagerAccount, userAccount] = signers;
      const amount = 1;

      await knnPreSale.addClaimManager(claimManagerAccount.address);

      const managerSession = await ethers.getContractAt(
        "KannaPreSale",
        knnPreSale.address,
        claimManagerAccount
      );

      const tx = managerSession.claim(userAccount.address, amount, ref);

      await expect(tx).to.be.reverted;
    });

    it("should validate CLAIM_MANAGER_ROLE", async () => {
      const [managerAccount, managerSession] = await getManagerSession();
      const userAccount = await getUserWallet();
      const amount = 1;

      await managerSession.lockSupply(amount, ref);
      await knnPreSale.removeClaimManager(managerAccount.address);

      const error = await managerSession
        .claim(userAccount.address, amount, ref)
        .then(() => null)
        .catch((e: object) => e);

      expect(error).to.not.null;
    });

    it("should withdraw contract ETH", async () => {
      const userAccount = await getUserWallet();

      await knnPreSale.buyTokens({ value: ethers.utils.parseEther("5.001001999238") });

      const userBalance = await ethers.provider.getBalance(userAccount.address);
      const preSaleBalance = await ethers.provider.getBalance(knnPreSale.address);

      await expect(knnPreSale.withdraw(userAccount.address))
        .to.emit(knnPreSale, 'Withdraw').withArgs(userAccount.address, preSaleBalance);

      const expetedUserBalance = userBalance.add(preSaleBalance);
      const newUserBalance = await ethers.provider.getBalance(userAccount.address);

      expect(newUserBalance).to.equal(expetedUserBalance);

      const newPreSalaBalance = await ethers.provider.getBalance(knnPreSale.address);

      expect(newPreSalaBalance).to.equal(0);
    });

    it("should end contract", async () => {
      const userAccount = await getUserWallet();

      const userBalance = await knnToken.balanceOf(userAccount.address);
      const availableSupply = await knnPreSale.availableSupply();

      knnPreSale.end(userAccount.address);

      const preSaleAvailable = await knnPreSale.available();

      expect(preSaleAvailable).to.false;

      const newAvailableSupply = await knnPreSale.availableSupply();

      expect(newAvailableSupply).to.equal(0);

      const newUserBalance = await knnToken.balanceOf(userAccount.address);
      const expetedUserBalance = userBalance.add(availableSupply);

      expect(newUserBalance).to.equal(expetedUserBalance);
    });
  });
});
