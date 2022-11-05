import { ethers, network, waffle } from "hardhat";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { KannaTreasurer, KannaToken, KannaPreSale } from "../../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  getKnnToken,
  getKnnTreasurer,
  getKnnPreSale,
  getKnnTokenMock,
  getAggregatorMock,
} from "../../src/infrastructure/factories";

chai.use(chaiAsPromised);
const { expect } = chai;

const ref = "1";

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

  const getManagerSession = async (): Promise<
    [SignerWithAddress, KannaPreSale]
  > => {
    const [, managerWallet] = signers;

    await knnPreSale.addClaimManager(managerWallet.address);

    const managerSession = (await ethers.getContractAt(
      "KannaPreSale",
      knnPreSale.address,
      managerWallet
    )) as KannaPreSale;

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

    it("should not initialize KNN PreSale with empty quotation", async () => {
      const deployerWallet = await getDeployerWallet();

      await expect(
        getKnnPreSale(deployerWallet, knnToken, knnTreasurer, undefined, "0")
      ).to.be.revertedWith("Invalid quotation");
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
        .to.emit(knnPreSale, "Purchase")
        .withArgs(
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

        await expect(knnPreSale.buyTokens(options)).to.be.revertedWith(
          "Pre sale NOT started yet"
        );
      });

      it("when amount is lower than USD_AGGREGATOR_DECIMALS", async () => {
        const invalidValue = 1e8 - 1;

        const options = { value: invalidValue };

        await expect(knnPreSale.buyTokens(options)).to.be.revertedWith(
          "Invalid amount"
        );
      });

      it("when amount is greater than contract balance", async () => {
        const deployerWallet = await getDeployerWallet();

        const balance = await knnToken.balanceOf(knnPreSale.address);

        const [balanceInWei] = await knnPreSale.convertToWEI(balance);

        await network.provider.send("hardhat_setBalance", [
          deployerWallet.address,
          ethers.utils.hexStripZeros(
            balanceInWei.add(ethers.utils.parseEther("1"))._hex
          ),
        ]);
        await network.provider.send("evm_mine");

        const options = { value: balanceInWei.add(1) };

        await expect(knnPreSale.buyTokens(options)).to.be.revertedWith(
          "Insufficient supply!"
        );
      });

      it("when amount is greater than available supply", async () => {
        const deployerWallet = await getDeployerWallet();
        const [, managerSession] = await getManagerSession();

        const balance = await knnToken.balanceOf(knnPreSale.address);
        const [balanceInWei] = await knnPreSale.convertToWEI(balance);

        await network.provider.send("hardhat_setBalance", [
          deployerWallet.address,
          ethers.utils.hexStripZeros(
            balanceInWei.add(ethers.utils.parseEther("1"))._hex
          ),
        ]);
        await network.provider.send("evm_mine");

        await managerSession.lockSupply(1e10, ref);

        const options = { value: balanceInWei };

        await expect(knnPreSale.buyTokens(options)).to.be.revertedWith(
          "Insufficient supply!"
        );
      });

      it("when KNN transfer fail", async () => {
        const deployerWallet = await getDeployerWallet();
        const mockToken = await getKnnTokenMock(deployerWallet);

        await mockToken.mock.transfer.reverts();

        const knnPreSaleWithMock = await getKnnPreSale(
          deployerWallet,
          mockToken,
          knnTreasurer
        );

        const eth = ethers.utils.parseEther("5.001001999238");

        await expect(knnPreSaleWithMock.buyTokens({ value: eth })).to.be
          .reverted;
      });
    });

    it("should update quotation", async () => {
      const deployerWallet = await getDeployerWallet();

      const currentPriceHex = await knnPreSale.knnPriceInUSD();

      const quotation = 5 * 1e8;
      await expect(knnPreSale.updateQuotation(quotation))
        .to.emit(knnPreSale, "QuotationUpdate")
        .withArgs(deployerWallet.address, currentPriceHex, quotation);

      const newPriceHex = await knnPreSale.knnPriceInUSD();

      const currentPrice = parseInt(currentPriceHex._hex, 16);
      const newPrice = parseInt(newPriceHex._hex, 16);

      expect(currentPrice).to.lessThan(newPrice);
    });

    it("should not update quotation when empty amount", async () => {
      const quotation = 0;

      await expect(knnPreSale.updateQuotation(quotation)).to.be.revertedWith(
        "Invalid quotation"
      );
    });

    it("should lock supply", async () => {
      const [, managerSession] = await getManagerSession();

      const balance = await knnToken.balanceOf(knnPreSale.address);

      const toLock = 1e10;

      await expect(managerSession.lockSupply(toLock, ref))
        .to.emit(managerSession, "Lock")
        .withArgs(ref, toLock);

      let availableSupply = await knnPreSale.availableSupply();

      let expectedSupply = balance.sub(toLock);

      expect(availableSupply).to.eq(expectedSupply);

      await expect(managerSession.lockSupply(toLock, ref))
        .to.emit(managerSession, "Lock")
        .withArgs(ref, toLock);

      availableSupply = await knnPreSale.availableSupply();

      expectedSupply = expectedSupply.sub(toLock);

      expect(availableSupply).to.eq(expectedSupply);
    });

    describe("should not lock", async () => {
      it("when supply greater than supply", async () => {
        const [, managerSession] = await getManagerSession();

        const availableSupply = await knnPreSale.availableSupply();

        const toLock = availableSupply.add(1);

        await expect(managerSession.lockSupply(toLock, ref)).to.be.revertedWith(
          "Insufficient supply!"
        );
      });

      it("when empty amount", async () => {
        const [, managerSession] = await getManagerSession();

        const toLock = 0;

        await expect(managerSession.lockSupply(toLock, ref)).to.be.revertedWith(
          "Invalid amount"
        );
      });

      it("when invalid CLAIM_MANAGER_ROLE", async () => {
        const [managerAccount, managerSession] = await getManagerSession();
        const amount = 1;

        await knnPreSale.removeClaimManager(managerAccount.address);

        await expect(managerSession.lockSupply(amount, ref)).to.be.reverted;
      });
    });

    it("should unlock supply", async () => {
      const [, managerSession] = await getManagerSession();

      const balance = await knnToken.balanceOf(knnPreSale.address);

      const toLock = 1e10;

      await managerSession.lockSupply(toLock, ref);

      let expectedSupply = balance.sub(toLock);

      const firstUnlock = 1e9;

      await expect(managerSession.unlockSupply(firstUnlock, ref))
        .to.emit(managerSession, "Unlock")
        .withArgs(ref, firstUnlock);

      expectedSupply = expectedSupply.add(firstUnlock);

      let availableSupply = await knnPreSale.availableSupply();

      expect(availableSupply).to.eq(expectedSupply);

      const secondUnlock = 5 * 1e9;

      await expect(managerSession.unlockSupply(secondUnlock, ref))
        .to.emit(managerSession, "Unlock")
        .withArgs(ref, secondUnlock);

      expectedSupply = expectedSupply.add(secondUnlock);

      availableSupply = await knnPreSale.availableSupply();

      expect(availableSupply).to.eq(expectedSupply);
    });

    describe("should unlock lock", async () => {
      it("when supply greater than locked", async () => {
        const [, managerSession] = await getManagerSession();
        const toLock = 1e10;
        const toUnlock = toLock + 1;

        await managerSession.lockSupply(toLock, ref);

        await expect(
          managerSession.unlockSupply(toUnlock, ref)
        ).to.be.revertedWith("Insufficient locked supply!");
      });

      it("when empty amount", async () => {
        const [, managerSession] = await getManagerSession();

        const toUnlock = 0;

        await expect(
          managerSession.unlockSupply(toUnlock, ref)
        ).to.be.revertedWith("Invalid amount");
      });

      it("when invalid CLAIM_MANAGER_ROLE", async () => {
        const [managerAccount, managerSession] = await getManagerSession();
        const amount = 1;

        await knnPreSale.removeClaimManager(managerAccount.address);

        await expect(managerSession.unlockSupply(amount, ref)).to.be.reverted;
      });
    });

    it("should revert the receive function", async () => {
      const deployerWallet = await getDeployerWallet();

      await network.provider.send("hardhat_setBalance", [
        deployerWallet.address,
        "0xFFFFFFFFFFFFFFFF",
      ]);
      await network.provider.send("evm_mine");

      await expect(
        deployerWallet.sendTransaction({
          to: knnPreSale.address,
          value: ethers.utils.parseEther("5.001001999238"),
        })
      ).to.be.reverted;
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

      await expect(fakeDemoContract[nonExistentFuncSignature](8, 9)).to.be
        .reverted;
    });

    it("should allow claim", async () => {
      const [, managerSession] = await getManagerSession();
      const userAccount = await getUserWallet();

      const amount = 1;

      await managerSession.lockSupply(amount, ref);

      await expect(managerSession.claim(userAccount.address, amount, ref, true))
        .to.emit(managerSession, "Claim")
        .withArgs(userAccount.address, ref, amount);

      const balanceUint256 = await knnToken.balanceOf(userAccount.address);
      const balance = parseInt(balanceUint256._hex, 16);

      expect(balance).to.eq(amount);
    });

    it("should allow claim without unlocking", async () => {
      const [, managerSession] = await getManagerSession();
      const userAccount = await getUserWallet();

      const amount = 1;

      await expect(
        managerSession.claim(userAccount.address, amount, ref, false)
      )
        .to.emit(managerSession, "Claim")
        .withArgs(userAccount.address, ref, amount);

      const balanceUint256 = await knnToken.balanceOf(userAccount.address);
      const balance = parseInt(balanceUint256._hex, 16);

      expect(balance).to.eq(amount);
    });

    describe("should not claim", async () => {
      it("when claimable amount greater than locked", async () => {
        const [, managerSession] = await getManagerSession();
        const userAccount = await getUserWallet();
        const amount = 1;

        await expect(
          managerSession.claim(userAccount.address, amount, ref, true)
        ).to.be.revertedWith("Insufficient locked amount");
      });

      it("when empty amount", async () => {
        const [, managerSession] = await getManagerSession();
        const userAccount = await getUserWallet();
        const amount = 0;

        await expect(
          managerSession.claim(userAccount.address, amount, ref, true)
        ).to.be.revertedWith("Invalid amount");
      });

      it("when insufficient balance", async () => {
        const deployerWallet = await getDeployerWallet();
        const userAccount = await getUserWallet();
        const mockToken = await getKnnTokenMock(deployerWallet);

        const knnPreSaleWithMock = await getKnnPreSale(
          deployerWallet,
          mockToken
        );
        await knnPreSaleWithMock.addClaimManager(deployerWallet.address);

        await mockToken.mock.balanceOf
          .withArgs(knnPreSaleWithMock.address)
          .returns(1e2);
        await mockToken.mock.transfer.returns(true);
        await mockToken.mock.balanceOf.returns(0);

        await knnPreSaleWithMock.lockSupply(1e2, ref);

        await mockToken.mock.balanceOf
          .withArgs(knnPreSaleWithMock.address)
          .returns(0);

        await expect(
          knnPreSaleWithMock.claim(userAccount.address, 1e2, ref, true)
        ).to.be.revertedWith("Insufficient balance");

        const eth = ethers.utils.parseEther("5.001001999238");

        await expect(knnPreSaleWithMock.buyTokens({ value: eth })).to.be
          .reverted;
      });

      it("when invalid CLAIM_MANAGER_ROLE", async () => {
        const [managerAccount, managerSession] = await getManagerSession();
        const userAccount = await getUserWallet();
        const amount = 1;

        await knnPreSale.removeClaimManager(managerAccount.address);

        await expect(
          managerSession.claim(userAccount.address, amount, ref, true)
        ).to.be.reverted;
      });
    });

    it("should withdraw contract ETH", async () => {
      const userAccount = await getUserWallet();

      await knnPreSale.buyTokens({
        value: ethers.utils.parseEther("5.001001999238"),
      });

      const userBalance = await ethers.provider.getBalance(userAccount.address);
      const preSaleBalance = await ethers.provider.getBalance(
        knnPreSale.address
      );

      await expect(knnPreSale.withdraw(userAccount.address))
        .to.emit(knnPreSale, "Withdraw")
        .withArgs(userAccount.address, preSaleBalance);

      const expetedUserBalance = userBalance.add(preSaleBalance);
      const newUserBalance = await ethers.provider.getBalance(
        userAccount.address
      );

      expect(newUserBalance).to.equal(expetedUserBalance);

      const newPreSalaBalance = await ethers.provider.getBalance(
        knnPreSale.address
      );

      expect(newPreSalaBalance).to.equal(0);
    });

    it("should not convert KNN to Wei when Invalid round answer", async () => {
      const deployerWallet = await getDeployerWallet();
      const aggregatorMock = await getAggregatorMock(deployerWallet);

      await aggregatorMock.mock.latestRoundData.returns(0, 0, 0, 0, 0);

      const knnPreSaleWithAggregatorMock = await getKnnPreSale(
        deployerWallet,
        knnToken,
        knnTreasurer,
        aggregatorMock.address
      );

      await expect(
        knnPreSaleWithAggregatorMock.convertToWEI(1e2)
      ).to.be.revertedWith("Invalid round answer");
    });

    it("should not convert Wei to KNN when Invalid round answer", async () => {
      const deployerWallet = await getDeployerWallet();
      const aggregatorMock = await getAggregatorMock(deployerWallet);

      await aggregatorMock.mock.latestRoundData.returns(0, 0, 0, 0, 0);

      const knnPreSaleWithAggregatorMock = await getKnnPreSale(
        deployerWallet,
        knnToken,
        knnTreasurer,
        aggregatorMock.address
      );

      await expect(
        knnPreSaleWithAggregatorMock.convertToKNN(1e2)
      ).to.be.revertedWith("Invalid round answer");
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

    it("should end contract without availableSupply", async () => {
      const [, managerSession] = await getManagerSession();
      const userAccount = await getUserWallet();

      const userBalance = await knnToken.balanceOf(userAccount.address);
      const availableSupply = await knnPreSale.availableSupply();

      await managerSession.lockSupply(availableSupply, ref);

      const newAvailableSupply = await knnPreSale.availableSupply();

      expect(newAvailableSupply).to.equal(0);

      knnPreSale.end(userAccount.address);

      const preSaleAvailable = await knnPreSale.available();

      expect(preSaleAvailable).to.false;

      const newUserBalance = await knnToken.balanceOf(userAccount.address);

      expect(newUserBalance).to.equal(userBalance);
    });
  });
});
