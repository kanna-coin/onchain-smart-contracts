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
      const [deployerWallet] = signers;

      await network.provider.send("hardhat_setBalance", [
        deployerWallet.address,
        "0xFFFFFFFFFFFFFFFF",
      ]);
      await network.provider.send("evm_mine");

      const options = { value: ethers.utils.parseEther("5.001001999238") };
      await knnPreSale.buyTokens(options);
      const tokensToSell = await knnToken.balanceOf(knnPreSale.address);
      const balance = parseInt(tokensToSell._hex, 16);

      expect(balance).to.lessThan(3.5e23);
    });

    describe("should not buy KNN tokens", async () => {
      it("when presale is unavailable", async () => {
        const [deployerWallet] = signers;

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
        const [deployerWallet] = signers;

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
        const [deployerWallet] = signers;

        await knnPreSale.addClaimManager(deployerWallet.address);

        await network.provider.send("hardhat_setBalance", [
          deployerWallet.address,
          "0xFFFFFFFFFFFFFFFF",
        ]);
        await network.provider.send("evm_mine");

        await knnPreSale.lockSupply(1e10, ref);

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
      const currentPriceHex = await knnPreSale.knnPriceInUSD();
      await knnPreSale.updateQuotation(5 * 1e8);
      const newPriceHex = await knnPreSale.knnPriceInUSD();

      const currentPrice = parseInt(currentPriceHex._hex, 16);
      const newPrice = parseInt(newPriceHex._hex, 16);

      expect(currentPrice).to.lessThan(newPrice);
    });

    it("should lock supply", async () => {
      const [deployerWallet] = signers;
      const balance = await knnToken.balanceOf(knnPreSale.address);

      const toLock = 1e10;

      await knnPreSale.addClaimManager(deployerWallet.address);
      await knnPreSale.lockSupply(toLock, ref);

      let availableSupply = await knnPreSale.availableSupply();

      let expectedSupply = balance.sub(toLock);

      expect(availableSupply).to.eq(expectedSupply);

      await knnPreSale.lockSupply(toLock, ref);

      availableSupply = await knnPreSale.availableSupply();

      expectedSupply = expectedSupply.sub(toLock);

      expect(availableSupply).to.eq(expectedSupply);
    });

    it("should not lock supply greater than supply", async () => {
      const availableSupply = await knnPreSale.availableSupply();

      const toLock = availableSupply.add(1);

      const error = await knnPreSale
        .lockSupply(toLock, ref)
        .then(() => null)
        .catch((e) => e);

      expect(error).to.not.null;
    });

    it("should unlock supply", async () => {
      const [deployerWallet] = signers;

      const balance = await knnToken.balanceOf(knnPreSale.address);

      const toLock = 1e10;

      await knnPreSale.addClaimManager(deployerWallet.address);
      await knnPreSale.lockSupply(toLock, ref);

      let expectedSupply = balance.sub(toLock);

      await knnPreSale.unlockSupply(1e9, ref);

      expectedSupply = expectedSupply.add(1e9);

      let availableSupply = await knnPreSale.availableSupply();

      expect(availableSupply).to.eq(expectedSupply);

      await knnPreSale.unlockSupply(5 * 1e9, ref);

      expectedSupply = expectedSupply.add(5 * 1e9);

      availableSupply = await knnPreSale.availableSupply();

      expect(availableSupply).to.eq(expectedSupply);
    });

    it("should not unlock supply greater than locked", async () => {
      const [deployerWallet] = signers;
      const toLock = 1e10;
      const toUnlock = toLock + 1;

      await knnPreSale.addClaimManager(deployerWallet.address);
      await knnPreSale.lockSupply(toLock, ref);

      const error = await knnPreSale
        .unlockSupply(toUnlock, ref)
        .then(() => null)
        .catch((e) => e);

      expect(error).to.not.null;
    });

    it("should revert the receive function", async () => {
      const [deployerWallet] = signers;

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
      const [deployerWallet] = signers;

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

      await managerSession.claim(userAccount.address, amount, ref);

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
      const [deployerWallet, claimManagerAccount, userAccount] = signers;
      const amount = 1;

      await knnPreSale.addClaimManager(deployerWallet.address);
      await knnPreSale.lockSupply(amount, ref);
      await knnPreSale.removeClaimManager(claimManagerAccount.address);

      const managerSession = await ethers.getContractAt(
        "KannaPreSale",
        knnPreSale.address,
        claimManagerAccount
      );

      const error = await managerSession
        .claim(userAccount.address, amount, ref)
        .then(() => null)
        .catch((e: object) => e);

      expect(error).to.not.null;
    });
  });
});
