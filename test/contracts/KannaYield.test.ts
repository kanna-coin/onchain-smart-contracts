import { ethers, network } from "hardhat";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { KannaYield, KannaTreasurer, KannaToken } from "../../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import getKnnToken from "../../src/infrastructure/factories/KannaTokenFactory";
import getKnnTreasurer from "../../src/infrastructure/factories/KannaTreasurerFactory";
import getKnnYield from "../../src/infrastructure/factories/KannaYieldFactory";

chai.use(chaiAsPromised);
const { expect } = chai;

const tokenContractName = "KannaToken";
const yieldContractName = "KannaYield";
const yieldDefaultReward = "400000000000000000000000";

const parseKNN = (bigNumberish: any): number =>
  parseInt(ethers.utils.formatEther(bigNumberish).split(".")[0], 10);

const parse1e18 = (integer: number): string => `${integer}000000000000000000`;

describe("KNN Yield⬆", async () => {
  let knnToken: KannaToken;
  let knnTreasurer: KannaTreasurer;
  let knnYield: KannaYield;

  const [
    deployerWallet,
    firstHolder,
    secondHolder,
    thirdHolder,
    fourthHolder,
    fifthHolder,
    anyHolder,
  ] = await ethers.getSigners();

  beforeEach(async () => {
    knnToken = await getKnnToken(deployerWallet);

    knnTreasurer = await getKnnTreasurer(deployerWallet, knnToken);

    knnYield = await getKnnYield(deployerWallet, knnToken, knnTreasurer);
  });

  describe("KANNA Yield Tests", () => {
    it("should start with a 400K balance", async () => {
      const yieldBalance = await knnToken.balanceOf(knnYield.address);
      const balance = parseInt(yieldBalance._hex, 16);

      const poolBalance = await knnYield.knnYieldPool();
      const poolSize = parseInt(poolBalance._hex, 16);

      expect(balance).to.eq(4e23);
      expect(poolSize).to.eq(0);
    });

    it("should allow to re-add/extend reward", async () => {
      const rewardsDuration = 365 * 24 * 60 ** 2;
      const rewardAmount = "100000000000000000000000";

      const [err1, err2] = await Promise.all([
        knnYield
          .addReward(rewardAmount, rewardsDuration)
          .then(() => null)
          .catch((e) => e),
        knnYield
          .addReward(rewardAmount, rewardsDuration)
          .then(() => null)
          .catch((e) => e),
      ]);

      expect(err1).to.null;
      expect(err2).to.null;
    });

    it("should allow user to subscribe for 200.0 KNN", async () => {
      const subscriptionAmount = "200000000000000000000000";
      const txTransfer = await knnTreasurer.release(
        anyHolder.address,
        subscriptionAmount
      );

      txTransfer.wait();

      const tokenSession = await ethers.getContractAt(
        tokenContractName,
        knnToken.address,
        anyHolder
      );

      const yieldSession = await ethers.getContractAt(
        yieldContractName,
        knnYield.address,
        anyHolder
      );

      const approval = await tokenSession.approve(
        knnYield.address,
        subscriptionAmount
      );

      await approval.wait();

      const rewardTx = await knnYield.addReward(
        yieldDefaultReward,
        1 * 60 * 60 * 24 * 90
      );

      await rewardTx.wait();

      const subscription = await yieldSession.subscribe(subscriptionAmount);
      await subscription.wait();

      const balance = await knnYield.balanceOf(anyHolder.address);

      expect(parseKNN(balance)).to.eq(parseKNN(subscriptionAmount));
    });

    it("should distribute a 400K rewards over a yearly duration for 3holders EQUALY", async () => {
      const rewardsDuration = 365 * 24 * 60 ** 2;

      const amount = "800000000000000000000000";
      const rewardAmount = "400000000000000000000000";

      await knnTreasurer.release(knnYield.address, rewardAmount);
      await knnTreasurer.release(firstHolder.address, amount);
      await knnTreasurer.release(secondHolder.address, amount);
      await knnTreasurer.release(thirdHolder.address, amount);

      const firstHolderTokenSession = await ethers.getContractAt(
        tokenContractName,
        knnToken.address,
        firstHolder
      );

      const secondHolderTokenSession = await ethers.getContractAt(
        tokenContractName,
        knnToken.address,
        secondHolder
      );

      const thirdHolderTokenSession = await ethers.getContractAt(
        tokenContractName,
        knnToken.address,
        thirdHolder
      );

      const firstHolderYieldSession = await ethers.getContractAt(
        yieldContractName,
        knnYield.address,
        firstHolder
      );

      const secondHolderYieldSession = await ethers.getContractAt(
        yieldContractName,
        knnYield.address,
        secondHolder
      );

      const thirdHolderYieldSession = await ethers.getContractAt(
        yieldContractName,
        knnYield.address,
        thirdHolder
      );

      await firstHolderTokenSession.approve(knnYield.address, amount);
      await secondHolderTokenSession.approve(knnYield.address, amount);
      await thirdHolderTokenSession.approve(knnYield.address, amount);

      await knnYield.addReward(rewardAmount, rewardsDuration);

      await firstHolderYieldSession.subscribe(amount);
      await secondHolderYieldSession.subscribe(amount);
      await thirdHolderYieldSession.subscribe(amount);

      await network.provider.send("evm_increaseTime", [90 * 24 * 60 ** 2]);
      await network.provider.send("evm_mine");

      await firstHolderYieldSession.exit();
      await secondHolderYieldSession.exit();
      await thirdHolderYieldSession.exit();

      const firstHolderBalance = await knnToken.balanceOf(firstHolder.address);
      const secondHolderBalance = await knnToken.balanceOf(
        secondHolder.address
      );

      const thirdHolderBalance = await knnToken.balanceOf(thirdHolder.address);

      console.info(
        "Earned KNN Rewards | 1st Holder =>",
        parseKNN(firstHolderBalance) - parseKNN(amount)
      );

      console.info(
        "Earned KNN Rewards | 2nd Holder =>",
        parseKNN(secondHolderBalance) - parseKNN(amount)
      );

      console.info(
        "Earned KNN Rewards | 3rd Holder =>",
        parseKNN(thirdHolderBalance) - parseKNN(amount)
      );

      expect(parseKNN(firstHolderBalance)).to.greaterThan(parseKNN(amount));

      expect(parseKNN(firstHolderBalance)).to.lessThanOrEqual(
        parseKNN(amount) + parseKNN(rewardAmount) / 3
      );

      expect(parseKNN(secondHolderBalance)).to.greaterThan(parseKNN(amount));

      expect(parseKNN(secondHolderBalance)).to.lessThanOrEqual(
        parseKNN(amount) + parseKNN(rewardAmount) / 3
      );

      expect(parseKNN(thirdHolderBalance)).to.greaterThan(parseKNN(amount));

      expect(parseKNN(thirdHolderBalance)).to.lessThanOrEqual(
        parseKNN(amount) + parseKNN(rewardAmount) / 3
      );
    });

    it("should distribute a 400K rewards over a yearly duration for a single holder", async () => {
      const rewardsDuration = 365 * 24 * 60 ** 2;

      const [firstAmount] = ["800000000000000000000000"];
      const rewardAmount = "400000000000000000000000";

      const txTransfer = await knnTreasurer.release(
        firstHolder.address,
        firstAmount
      );

      await txTransfer.wait();

      const firstHolderTokenSession = await ethers.getContractAt(
        tokenContractName,
        knnToken.address,
        firstHolder
      );

      const firstHolderYieldSession = await ethers.getContractAt(
        yieldContractName,
        knnYield.address,
        firstHolder
      );

      await knnYield.addReward(rewardAmount, rewardsDuration);

      await firstHolderTokenSession.approve(knnYield.address, firstAmount);
      await firstHolderYieldSession.subscribe(firstAmount);

      await network.provider.send("evm_increaseTime", [rewardsDuration]);

      const firstExitTx = await firstHolderYieldSession.exit();
      await firstExitTx.wait();

      const firstHolderBalance = await knnToken.balanceOf(firstHolder.address);

      expect(parseKNN(firstHolderBalance)).to.greaterThan(
        parseKNN(firstAmount)
      );

      expect(parseKNN(firstHolderBalance)).to.lessThanOrEqual(
        parseKNN(firstAmount) + parseKNN(rewardAmount)
      );

      console.info(
        "Earned KNN Rewards =>",
        parseKNN(firstHolderBalance) - parseKNN(firstAmount)
      );
    });

    // it("should validate Claim", async () => {
    //   const rewardsDuration = 100 * 24 * 60 ** 2;
    //   const day = 1 * 24 * 60 ** 2;

    //   const reward = 400000;

    //   const amount = 1;
    //   const rewardAmount = parse1e18(reward * 3);
    //   const secondReward = reward / 10;

    //   await knnTreasurer.release(knnYield.address, rewardAmount);
    //   await knnTreasurer.release(firstHolder.address, parse1e18(amount));
    //   await knnTreasurer.release(secondHolder.address, parse1e18(amount));

    //   const firstHolderTokenSession = await ethers.getContractAt(
    //     tokenContractName,
    //     knnToken.address,
    //     firstHolder
    //   );

    //   await firstHolderTokenSession.approve(
    //     knnYield.address,
    //     parse1e18(amount)
    //   );

    //   const secondHolderTokenSession = await ethers.getContractAt(
    //     tokenContractName,
    //     knnToken.address,
    //     secondHolder
    //   );

    //   await secondHolderTokenSession.approve(
    //     knnYield.address,
    //     parse1e18(amount)
    //   );

    //   await knnYield.addReward(parse1e18(reward / 2), rewardsDuration);
    //   await network.provider.send("evm_mine");

    //   const firstHolderYieldSession = await ethers.getContractAt(
    //     yieldContractName,
    //     knnYield.address,
    //     firstHolder
    //   );

    //   const secondHolderYieldSession = await ethers.getContractAt(
    //     yieldContractName,
    //     knnYield.address,
    //     secondHolder
    //   );

    //   await firstHolderYieldSession.subscribe(parse1e18(amount));
    //   await secondHolderYieldSession.subscribe(parse1e18(amount));
    //   await network.provider.send("evm_mine");

    //   let newRewardAdded = false;
    //   for (let i = day; i < rewardsDuration; i += day * 2) {
    //     await firstHolderYieldSession.claim();
    //     await network.provider.send("evm_mine");
    //     await network.provider.send("evm_increaseTime", [i]);
    //     await network.provider.send("evm_mine");

    //     if (i > rewardsDuration / 2 && !newRewardAdded) {
    //       await knnYield.addReward(parse1e18(reward / 10), rewardsDuration / 2);
    //       newRewardAdded = true;
    //     }
    //   }

    //   await firstHolderYieldSession.exit();
    //   await secondHolderYieldSession.exit();
    //   await network.provider.send("evm_mine");

    //   const firstHolderBalance = await knnToken.balanceOf(firstHolder.address);
    //   const secondHolderBalance = await knnToken.balanceOf(
    //     secondHolder.address
    //   );
    //   const firstBalanceAmount = parseKNN(firstHolderBalance);
    //   const secondBalanceAmount = parseKNN(secondHolderBalance);

    //   expect(firstBalanceAmount).to.lessThan(secondBalanceAmount);
    //   expect(firstBalanceAmount + secondBalanceAmount).to.lessThanOrEqual(
    //     reward + secondReward
    //   );
    // });

    // it("should validate ReApply", async () => {
    //   const rewardsDuration = 100 * 24 * 60 ** 2;
    //   const day = 1 * 24 * 60 ** 2;

    //   const reward = 400000;

    //   const amount = 1;
    //   const rewardAmount = parse1e18(reward);

    //   await knnTreasurer.release(knnYield.address, rewardAmount);
    //   await knnTreasurer.release(firstHolder.address, parse1e18(amount));
    //   await knnTreasurer.release(secondHolder.address, parse1e18(amount));

    //   const firstHolderTokenSession = await ethers.getContractAt(
    //     tokenContractName,
    //     knnToken.address,
    //     firstHolder
    //   );

    //   await firstHolderTokenSession.approve(
    //     knnYield.address,
    //     parse1e18(amount)
    //   );

    //   const secondHolderTokenSession = await ethers.getContractAt(
    //     tokenContractName,
    //     knnToken.address,
    //     secondHolder
    //   );

    //   await secondHolderTokenSession.approve(
    //     knnYield.address,
    //     parse1e18(amount)
    //   );

    //   await knnYield.addReward(rewardAmount, rewardsDuration);
    //   await network.provider.send("evm_mine");

    //   const firstHolderYieldSession = await ethers.getContractAt(
    //     yieldContractName,
    //     knnYield.address,
    //     firstHolder
    //   );

    //   const secondHolderYieldSession = await ethers.getContractAt(
    //     yieldContractName,
    //     knnYield.address,
    //     secondHolder
    //   );

    //   await firstHolderYieldSession.subscribe(parse1e18(amount));
    //   await secondHolderYieldSession.subscribe(parse1e18(amount));
    //   await network.provider.send("evm_mine");

    //   for (let i = day; i < rewardsDuration / 10; i += day) {
    //     await firstHolderYieldSession.reApply();

    //     await network.provider.send("evm_mine");
    //     await network.provider.send("evm_increaseTime", [i]);
    //     await network.provider.send("evm_mine");

    //     if (i >= 7 * day) {
    //       continue;
    //     }

    //     await secondHolderYieldSession.reApply();
    //   }

    //   await firstHolderYieldSession.exit();
    //   await secondHolderYieldSession.exit();
    //   await network.provider.send("evm_mine");

    //   const firstHolderBalance = await knnToken.balanceOf(firstHolder.address);
    //   const secondHolderBalance = await knnToken.balanceOf(
    //     secondHolder.address
    //   );
    //   const firstBalanceAmount = parseKNN(firstHolderBalance);
    //   const secondBalanceAmount = parseKNN(secondHolderBalance);

    //   expect(firstBalanceAmount).to.greaterThan(secondBalanceAmount);
    //   expect(firstBalanceAmount + secondBalanceAmount).to.lessThanOrEqual(
    //     reward
    //   );
    // });

    it("should distribute a 400K rewards over a yearly duration for two holders accordingly", async () => {
      const rewardsDuration = 365 * 24 * 60 ** 2;

      const [firstAmount, secondAmount] = [
        "800000000000000000000000",
        "800000000000000000000000",
      ];
      const rewardAmount = "400000000000000000000000";

      // await knnToken.mint("9000000000000000000000000");
      await knnTreasurer.release(knnYield.address, rewardAmount);

      const firstTxTransfer = await knnTreasurer.release(
        firstHolder.address,
        firstAmount
      );

      await firstTxTransfer.wait();

      const secondTxTransfer = await knnTreasurer.release(
        secondHolder.address,
        secondAmount
      );

      await secondTxTransfer.wait();

      const firstHolderTokenSession = await ethers.getContractAt(
        tokenContractName,
        knnToken.address,
        firstHolder
      );

      const secondHolderTokenSession = await ethers.getContractAt(
        tokenContractName,
        knnToken.address,
        secondHolder
      );

      const firstHolderYieldSession = await ethers.getContractAt(
        yieldContractName,
        knnYield.address,
        firstHolder
      );

      const secondHolderYieldSession = await ethers.getContractAt(
        yieldContractName,
        knnYield.address,
        secondHolder
      );

      await firstHolderTokenSession.approve(knnYield.address, firstAmount);
      await secondHolderTokenSession.approve(knnYield.address, secondAmount);

      await knnYield.addReward(rewardAmount, rewardsDuration);

      await firstHolderYieldSession.subscribe(firstAmount);
      await secondHolderYieldSession.subscribe(secondAmount);

      await network.provider.send("evm_increaseTime", [rewardsDuration / 5]);
      await network.provider.send("evm_mine");

      await network.provider.send("evm_increaseTime", [rewardsDuration / 5]);
      await network.provider.send("evm_mine");

      await network.provider.send("evm_increaseTime", [rewardsDuration / 5]);
      await network.provider.send("evm_mine");

      const secondExitTx = await secondHolderYieldSession.exit();
      await secondExitTx.wait();

      await network.provider.send("evm_increaseTime", [rewardsDuration / 5]);
      await network.provider.send("evm_mine");

      await network.provider.send("evm_increaseTime", [rewardsDuration / 5]);
      await network.provider.send("evm_mine");

      const firstExitTx = await firstHolderYieldSession.exit();

      await firstExitTx.wait();

      const firstHolderBalance = await knnToken.balanceOf(firstHolder.address);
      const secondHolderBalance = await knnToken.balanceOf(
        secondHolder.address
      );

      expect(parseKNN(firstHolderBalance)).to.greaterThan(
        parseKNN(firstAmount)
      );

      expect(parseKNN(secondHolderBalance)).to.greaterThan(
        parseKNN(secondAmount)
      );

      expect(parseKNN(secondHolderBalance)).to.lessThan(
        parseKNN(secondAmount) + parseKNN(rewardAmount) / 2
      );

      expect(parseKNN(firstHolderBalance)).to.greaterThan(
        parseKNN(firstAmount) + parseKNN(rewardAmount) / 2
      );

      console.info(
        "Earned KNN Rewards | 1st Holder =>",
        parseKNN(firstHolderBalance) - parseKNN(firstAmount)
      );

      console.info(
        "Earned KNN Rewards | 2nd Holder =>",
        parseKNN(secondHolderBalance) - parseKNN(secondAmount)
      );
    });

    it("[2]should distribute a 400K rewards over a yearly duration for two holders accordingly", async () => {
      const rewardsDuration = 365 * 24 * 60 ** 2;

      const [firstAmount, secondAmount] = [
        "800000000000000000000000",
        "800000000000000000000000",
      ];
      const rewardAmount = "400000000000000000000000";

      // await knnToken.mint("9000000000000000000000000");
      await knnTreasurer.release(knnYield.address, rewardAmount);

      const firstTxTransfer = await knnTreasurer.release(
        firstHolder.address,
        firstAmount
      );

      await firstTxTransfer.wait();

      const secondTxTransfer = await knnTreasurer.release(
        secondHolder.address,
        secondAmount
      );

      await secondTxTransfer.wait();

      const firstHolderTokenSession = await ethers.getContractAt(
        tokenContractName,
        knnToken.address,
        firstHolder
      );

      const secondHolderTokenSession = await ethers.getContractAt(
        tokenContractName,
        knnToken.address,
        secondHolder
      );

      const firstHolderYieldSession = await ethers.getContractAt(
        yieldContractName,
        knnYield.address,
        firstHolder
      );

      const secondHolderYieldSession = await ethers.getContractAt(
        yieldContractName,
        knnYield.address,
        secondHolder
      );

      await firstHolderTokenSession.approve(knnYield.address, firstAmount);
      await secondHolderTokenSession.approve(knnYield.address, secondAmount);

      await knnYield.addReward(rewardAmount, rewardsDuration);

      await firstHolderYieldSession.subscribe(firstAmount);
      await secondHolderYieldSession.subscribe(secondAmount);

      await network.provider.send("evm_increaseTime", [24 * 60 * 60]);
      await network.provider.send("evm_mine");

      await network.provider.send("evm_increaseTime", [rewardsDuration / 5]);
      await network.provider.send("evm_mine");

      await network.provider.send("evm_increaseTime", [rewardsDuration / 5]);
      await network.provider.send("evm_mine");

      const secondExitTx = await secondHolderYieldSession.exit();
      await secondExitTx.wait();

      await network.provider.send("evm_increaseTime", [rewardsDuration / 5]);
      await network.provider.send("evm_mine");

      await network.provider.send("evm_increaseTime", [rewardsDuration / 5]);
      await network.provider.send("evm_mine");

      const firstExitTx = await firstHolderYieldSession.exit();

      await firstExitTx.wait();

      const firstHolderBalance = await knnToken.balanceOf(firstHolder.address);
      const secondHolderBalance = await knnToken.balanceOf(
        secondHolder.address
      );

      expect(parseKNN(firstHolderBalance)).to.greaterThan(
        parseKNN(firstAmount)
      );

      expect(parseKNN(secondHolderBalance)).to.greaterThan(
        parseKNN(secondAmount)
      );

      expect(parseKNN(secondHolderBalance)).to.lessThan(
        parseKNN(secondAmount) + parseKNN(rewardAmount) / 2
      );

      expect(parseKNN(firstHolderBalance)).to.greaterThan(
        parseKNN(firstAmount) + parseKNN(rewardAmount) / 2
      );

      console.info(
        "Earned KNN Rewards | 1st Holder =>",
        parseKNN(firstHolderBalance) - parseKNN(firstAmount)
      );

      console.info(
        "Earned KNN Rewards | 2nd Holder =>",
        parseKNN(secondHolderBalance) - parseKNN(secondAmount)
      );
    });

    it("should distribute a 400K rewards over a yearly duration for 3holders accordingly", async () => {
      const rewardsDuration = 365 * 24 * 60 ** 2;

      const amount = "800000000000000000000000";
      const rewardAmount = "400000000000000000000000";

      // await knnToken.mint("9000000000000000000000000");
      await knnTreasurer.release(knnYield.address, rewardAmount);

      const firstTxTransfer = await knnTreasurer.release(
        firstHolder.address,
        amount
      );

      await firstTxTransfer.wait();

      const secondTxTransfer = await knnTreasurer.release(
        secondHolder.address,
        amount
      );

      await secondTxTransfer.wait();

      const thirdTxTransfer = await knnTreasurer.release(
        thirdHolder.address,
        amount
      );

      await thirdTxTransfer.wait();

      const firstHolderTokenSession = await ethers.getContractAt(
        tokenContractName,
        knnToken.address,
        firstHolder
      );

      const secondHolderTokenSession = await ethers.getContractAt(
        tokenContractName,
        knnToken.address,
        secondHolder
      );

      const thirdHolderTokenSession = await ethers.getContractAt(
        tokenContractName,
        knnToken.address,
        thirdHolder
      );

      const firstHolderYieldSession = await ethers.getContractAt(
        yieldContractName,
        knnYield.address,
        firstHolder
      );

      const secondHolderYieldSession = await ethers.getContractAt(
        yieldContractName,
        knnYield.address,
        secondHolder
      );

      const thirdHolderYieldSession = await ethers.getContractAt(
        yieldContractName,
        knnYield.address,
        thirdHolder
      );

      await firstHolderTokenSession.approve(knnYield.address, amount);
      await secondHolderTokenSession.approve(knnYield.address, amount);
      await thirdHolderTokenSession.approve(knnYield.address, amount);

      await knnYield.addReward(rewardAmount, rewardsDuration);

      await firstHolderYieldSession.subscribe(amount);

      await network.provider.send("evm_increaseTime", [7 * 24 * 60 ** 2]);
      await network.provider.send("evm_mine");

      await secondHolderYieldSession.subscribe(amount);

      await network.provider.send("evm_increaseTime", [53 * 24 * 60 ** 2]);
      await network.provider.send("evm_mine");

      await thirdHolderYieldSession.subscribe(amount);

      await network.provider.send("evm_increaseTime", [90 * 24 * 60 ** 2]);
      await network.provider.send("evm_mine");

      const firstExitTx = await firstHolderYieldSession.exit();
      const secondExitTx = await secondHolderYieldSession.exit();
      const thirdExitTx = await thirdHolderYieldSession.exit();
      await firstExitTx.wait();
      await secondExitTx.wait();
      await thirdExitTx.wait();

      const firstHolderBalance = await knnToken.balanceOf(firstHolder.address);
      const secondHolderBalance = await knnToken.balanceOf(
        secondHolder.address
      );

      const thirdHolderBalance = await knnToken.balanceOf(thirdHolder.address);

      console.info(
        "Earned KNN Rewards | 1st Holder =>",
        parseKNN(firstHolderBalance) - parseKNN(amount)
      );

      console.info(
        "Earned KNN Rewards | 2nd Holder =>",
        parseKNN(secondHolderBalance) - parseKNN(amount)
      );

      console.info(
        "Earned KNN Rewards | 3rd Holder =>",
        parseKNN(thirdHolderBalance) - parseKNN(amount)
      );

      expect(parseKNN(firstHolderBalance)).to.greaterThan(parseKNN(amount));
      expect(parseKNN(secondHolderBalance)).to.greaterThan(parseKNN(amount));
      expect(parseKNN(thirdHolderBalance)).to.greaterThan(parseKNN(amount));

      expect(parseKNN(secondHolderBalance)).to.lessThan(
        parseKNN(firstHolderBalance)
      );

      expect(parseKNN(thirdHolderBalance)).to.lessThan(
        parseKNN(secondHolderBalance)
      );
    });

    it("should distribute a 400K rewards over a yearly duration for two holders in a half EQUALY", async () => {
      const rewardsDuration = 365 * 24 * 60 ** 2;

      const [firstAmount, secondAmount] = [
        "800000000000000000000000",
        "800000000000000000000000",
      ];
      const rewardAmount = "400000000000000000000000";

      // await knnToken.mint("9000000000000000000000000");
      await knnTreasurer.release(knnYield.address, rewardAmount);

      const firstTxTransfer = await knnTreasurer.release(
        firstHolder.address,
        firstAmount
      );

      await firstTxTransfer.wait();

      const secondTxTransfer = await knnTreasurer.release(
        secondHolder.address,
        secondAmount
      );

      await secondTxTransfer.wait();

      const firstHolderTokenSession = await ethers.getContractAt(
        tokenContractName,
        knnToken.address,
        firstHolder
      );

      const secondHolderTokenSession = await ethers.getContractAt(
        tokenContractName,
        knnToken.address,
        secondHolder
      );

      const firstHolderYieldSession = await ethers.getContractAt(
        yieldContractName,
        knnYield.address,
        firstHolder
      );

      const secondHolderYieldSession = await ethers.getContractAt(
        yieldContractName,
        knnYield.address,
        secondHolder
      );

      await firstHolderTokenSession.approve(knnYield.address, firstAmount);
      await secondHolderTokenSession.approve(knnYield.address, secondAmount);

      await knnYield.addReward(rewardAmount, rewardsDuration);

      await firstHolderYieldSession.subscribe(firstAmount);
      await secondHolderYieldSession.subscribe(secondAmount);

      await network.provider.send("evm_increaseTime", [rewardsDuration]);
      await network.provider.send("evm_mine");

      const firstExitTx = await firstHolderYieldSession.exit();
      const secondExitTx = await secondHolderYieldSession.exit();
      await firstExitTx.wait();
      await secondExitTx.wait();

      const firstHolderBalance = await knnToken.balanceOf(firstHolder.address);
      const secondHolderBalance = await knnToken.balanceOf(
        secondHolder.address
      );

      console.info(
        "Earned KNN Rewards | 1st Holder =>",
        parseKNN(firstHolderBalance) - parseKNN(firstAmount)
      );

      console.info(
        "Earned KNN Rewards | 2nd Holder =>",
        parseKNN(secondHolderBalance) - parseKNN(secondAmount)
      );

      expect(parseKNN(firstHolderBalance)).to.greaterThan(
        parseKNN(firstAmount)
      );

      expect(parseKNN(firstHolderBalance)).to.lessThanOrEqual(
        parseKNN(firstAmount) + parseKNN(rewardAmount) / 2
      );

      expect(parseKNN(secondHolderBalance)).to.greaterThan(
        parseKNN(secondAmount)
      );

      expect(parseKNN(secondHolderBalance)).to.lessThanOrEqual(
        parseKNN(secondAmount) + parseKNN(rewardAmount) / 2
      );
    });

    it("should validate Tier #1 FEE (plus Subscription FEE) 30% + 0.2% when before completing 1 day", async () => {
      const rewardsDuration = 90 * 24 * 60 ** 2;

      const amount = 100000;
      const rewardAmount = parse1e18(1);

      await knnTreasurer.release(knnYield.address, rewardAmount);
      await knnTreasurer.release(firstHolder.address, parse1e18(amount));

      const firstHolderTokenSession = await ethers.getContractAt(
        tokenContractName,
        knnToken.address,
        firstHolder
      );

      await firstHolderTokenSession.approve(
        knnYield.address,
        parse1e18(amount)
      );

      await knnYield.addReward(rewardAmount, rewardsDuration);
      await network.provider.send("evm_mine");

      const firstHolderYieldSession = await ethers.getContractAt(
        yieldContractName,
        knnYield.address,
        firstHolder
      );

      await firstHolderYieldSession.subscribe(parse1e18(amount));
      await network.provider.send("evm_mine");
      await firstHolderYieldSession.exit();
      await network.provider.send("evm_mine");

      const firstHolderBalance = await knnToken.balanceOf(firstHolder.address);
      const balanceAmount = parseKNN(firstHolderBalance);
      const fee = 0.302;
      const maxValueAfterFees = amount * (1 - fee);

      expect(balanceAmount).to.eq(maxValueAfterFees);
    });

    it("should validate Tier #2 FEE (plus Subscription FEE) 5% + 0.2% after completing 1 day", async () => {
      const rewardsDuration = 90 * 24 * 60 ** 2;

      const amount = 100000;
      const rewardAmount = parse1e18(1);

      await knnTreasurer.release(knnYield.address, rewardAmount);
      await knnTreasurer.release(anyHolder.address, parse1e18(amount));

      const firstHolderTokenSession = await ethers.getContractAt(
        tokenContractName,
        knnToken.address,
        anyHolder
      );

      await firstHolderTokenSession.approve(
        knnYield.address,
        parse1e18(amount)
      );

      await knnYield.addReward(rewardAmount, rewardsDuration);
      await network.provider.send("evm_mine");

      const firstHolderYieldSession = await ethers.getContractAt(
        yieldContractName,
        knnYield.address,
        anyHolder
      );

      await firstHolderYieldSession.subscribe(parse1e18(amount));
      await network.provider.send("evm_mine");
      await network.provider.send("evm_increaseTime", [1 * 24 * 60 ** 2]);
      await network.provider.send("evm_mine");
      await firstHolderYieldSession.exit();
      await network.provider.send("evm_mine");

      const firstHolderBalance = await knnToken.balanceOf(anyHolder.address);
      const balanceAmount = parseKNN(firstHolderBalance);
      const fee = 0.052;
      const maxValueAfterFees = amount * (1 - fee);

      expect(balanceAmount).to.eq(maxValueAfterFees);
    });

    it("should validate Tier #3 FEE (plus Subscription FEE) 2.5% + 0.2% after completing 7 days", async () => {
      const rewardsDuration = 90 * 24 * 60 ** 2;

      const amount = 100000;
      const rewardAmount = parse1e18(1);

      await knnTreasurer.release(knnYield.address, rewardAmount);
      await knnTreasurer.release(anyHolder.address, parse1e18(amount));

      const firstHolderTokenSession = await ethers.getContractAt(
        tokenContractName,
        knnToken.address,
        anyHolder
      );

      await firstHolderTokenSession.approve(
        knnYield.address,
        parse1e18(amount)
      );

      await knnYield.addReward(rewardAmount, rewardsDuration);
      await network.provider.send("evm_mine");

      const firstHolderYieldSession = await ethers.getContractAt(
        yieldContractName,
        knnYield.address,
        anyHolder
      );

      await firstHolderYieldSession.subscribe(parse1e18(amount));
      await network.provider.send("evm_mine");
      await network.provider.send("evm_increaseTime", [7 * 24 * 60 ** 2]);
      await network.provider.send("evm_mine");
      await firstHolderYieldSession.exit();
      await network.provider.send("evm_mine");

      const firstHolderBalance = await knnToken.balanceOf(anyHolder.address);
      const balanceAmount = parseKNN(firstHolderBalance);
      const fee = 0.027;
      const maxValueAfterFees = amount * (1 - fee);

      expect(balanceAmount).to.eq(maxValueAfterFees);
    });

    // it("should validate Tier #4 FEE (plus Subscription FEE) 1.5% + 0.2% when after completing 30 days", async () => {
    //   const rewardsDuration = 90 * 24 * 60 ** 2;

    //   const amount = 100000;
    //   const rewardAmount = parse1e18(1);

    //   await knnTreasurer.release(knnYield.address, rewardAmount);
    //   await knnTreasurer.release(firstHolder.address, parse1e18(amount));

    //   const firstHolderTokenSession = await ethers.getContractAt(
    //     tokenContractName,
    //     knnToken.address,
    //     firstHolder
    //   );

    //   await firstHolderTokenSession.approve(
    //     knnYield.address,
    //     parse1e18(amount)
    //   );
    //   const firstHolderYieldSession = await ethers.getContractAt(
    //     yieldContractName,
    //     knnYield.address,
    //     firstHolder
    //   );

    //   await knnYield.addReward(rewardAmount, rewardsDuration);
    //   await firstHolderYieldSession.subscribe(parse1e18(amount));
    //   await network.provider.send("evm_mine");
    //   await network.provider.send("evm_increaseTime", [40 * 24 * 60 ** 2]);
    //   await network.provider.send("evm_mine");

    //   await network.provider.send("evm_mine");
    //   await firstHolderYieldSession.exit();
    //   await network.provider.send("evm_mine");

    //   const firstHolderBalance = await knnToken.balanceOf(firstHolder.address);
    //   const balanceAmount = parseKNN(firstHolderBalance);
    //   const fee = 0.015;
    //   const subscriptionFee = 0.002;
    //   const maxValueAfterFees = amount * (1 - fee) * (1 - subscriptionFee);

    //   expect(balanceAmount).to.eq(maxValueAfterFees);
    // });

    it("should validate Tier #4 FEE (plus Subscription FEE) 1.5% + 0.2% when after completing 30 days", async () => {
      const rewardsDuration = 90 * 24 * 60 ** 2;

      const amount = 1000000;
      const rewardAmount = parse1e18(1);

      await knnTreasurer.release(knnYield.address, rewardAmount);
      await knnTreasurer.release(firstHolder.address, parse1e18(amount));

      const firstHolderTokenSession = await ethers.getContractAt(
        tokenContractName,
        knnToken.address,
        firstHolder
      );

      await firstHolderTokenSession.approve(
        knnYield.address,
        parse1e18(amount)
      );

      await knnYield.addReward(rewardAmount, rewardsDuration);
      await network.provider.send("evm_mine");

      const firstHolderYieldSession = await ethers.getContractAt(
        yieldContractName,
        knnYield.address,
        firstHolder
      );

      await firstHolderYieldSession.subscribe(parse1e18(amount));
      await network.provider.send("evm_mine");
      await network.provider.send("evm_increaseTime", [30 * 24 * 60 ** 2]);
      await network.provider.send("evm_mine");
      await firstHolderYieldSession.exit();
      await network.provider.send("evm_mine");

      const firstHolderBalance = await knnToken.balanceOf(firstHolder.address);
      const balanceAmount = parseKNN(firstHolderBalance);
      const fee = 0.017;
      const maxValueAfterFees = amount * (1 - fee);

      expect(balanceAmount).to.eq(maxValueAfterFees);
    });

    it("should validate Tier #5 FEE (plus Subscription FEE) 1% + 0.2% when after completing 60 days", async () => {
      const rewardsDuration = 90 * 24 * 60 ** 2;

      const amount = 1000000;
      const rewardAmount = parse1e18(1);

      await knnTreasurer.release(knnYield.address, rewardAmount);
      await knnTreasurer.release(firstHolder.address, parse1e18(amount));

      const firstHolderTokenSession = await ethers.getContractAt(
        tokenContractName,
        knnToken.address,
        firstHolder
      );

      await firstHolderTokenSession.approve(
        knnYield.address,
        parse1e18(amount)
      );

      await knnYield.addReward(rewardAmount, rewardsDuration);
      await network.provider.send("evm_mine");

      const firstHolderYieldSession = await ethers.getContractAt(
        yieldContractName,
        knnYield.address,
        firstHolder
      );

      await firstHolderYieldSession.subscribe(parse1e18(amount));
      await network.provider.send("evm_mine");
      await network.provider.send("evm_increaseTime", [60 * 24 * 60 ** 2]);
      await network.provider.send("evm_mine");
      await firstHolderYieldSession.exit();
      await network.provider.send("evm_mine");

      const firstHolderBalance = await knnToken.balanceOf(firstHolder.address);
      const balanceAmount = parseKNN(firstHolderBalance);
      const fee = 0.012;
      const maxValueAfterFees = amount * (1 - fee);

      expect(balanceAmount).to.eq(maxValueAfterFees);
    });

    it("should validate Tier #6 FEE (plus Subscription FEE) 0.1% + 0.2% when after completing 90 days", async () => {
      const rewardsDuration = 180 * 24 * 60 ** 2;

      const amount = 1000000;
      const rewardAmount = parse1e18(1);

      await knnTreasurer.release(knnYield.address, rewardAmount);
      await knnTreasurer.release(firstHolder.address, parse1e18(amount));

      const firstHolderTokenSession = await ethers.getContractAt(
        tokenContractName,
        knnToken.address,
        firstHolder
      );

      await firstHolderTokenSession.approve(
        knnYield.address,
        parse1e18(amount)
      );

      await knnYield.addReward(rewardAmount, rewardsDuration);
      await network.provider.send("evm_mine");

      const firstHolderYieldSession = await ethers.getContractAt(
        yieldContractName,
        knnYield.address,
        firstHolder
      );

      await firstHolderYieldSession.subscribe(parse1e18(amount));
      await network.provider.send("evm_mine");
      await network.provider.send("evm_increaseTime", [90 * 24 * 60 ** 2]);
      await network.provider.send("evm_mine");
      await firstHolderYieldSession.exit();
      await network.provider.send("evm_mine");

      const firstHolderBalance = await knnToken.balanceOf(firstHolder.address);
      const balanceAmount = parseKNN(firstHolderBalance);
      const fee = 0.003;
      const maxValueAfterFees = amount * (1 - fee);

      expect(balanceAmount).to.eq(maxValueAfterFees);
    });

    it("should validate Tier REDUCED FEE (plus Subscription FEE) 0.1% + 0.2% when after finished", async () => {
      const rewardsDuration = 180 * 24 * 60 ** 2;

      const amount = 1000000;
      const rewardAmount = parse1e18(1);

      await knnTreasurer.release(knnYield.address, rewardAmount);
      await knnTreasurer.release(firstHolder.address, parse1e18(amount));

      const firstHolderTokenSession = await ethers.getContractAt(
        tokenContractName,
        knnToken.address,
        firstHolder
      );

      await firstHolderTokenSession.approve(
        knnYield.address,
        parse1e18(amount)
      );

      await knnYield.addReward(rewardAmount, rewardsDuration);
      await network.provider.send("evm_mine");

      const firstHolderYieldSession = await ethers.getContractAt(
        yieldContractName,
        knnYield.address,
        firstHolder
      );

      await firstHolderYieldSession.subscribe(parse1e18(amount));
      await network.provider.send("evm_mine");
      await network.provider.send("evm_increaseTime", [rewardsDuration + 1]);
      await network.provider.send("evm_mine");
      await firstHolderYieldSession.exit();
      await network.provider.send("evm_mine");

      const firstHolderBalance = await knnToken.balanceOf(firstHolder.address);
      const balanceAmount = parseKNN(firstHolderBalance);
      const fee = 0.003;
      const maxValueAfterFees = amount * (1 - fee);

      expect(balanceAmount).to.eq(maxValueAfterFees);
    });

    it("should withdraw applying correct fee", async () => {
      const rewardsDuration = 365 * 24 * 60 ** 2;

      const amount = "800000000000000000000000";
      const halfWithdrawAmount = "400000000000000000000000";
      const rewardAmount = "400000000000000000000000";

      // await knnToken.mint("9000000000000000000000000");
      await knnTreasurer.release(knnYield.address, rewardAmount);

      const firstTxTransfer = await knnTreasurer.release(
        firstHolder.address,
        amount
      );

      await firstTxTransfer.wait();

      const secondTxTransfer = await knnTreasurer.release(
        secondHolder.address,
        amount
      );

      await secondTxTransfer.wait();

      const thirdTxTransfer = await knnTreasurer.release(
        thirdHolder.address,
        amount
      );

      await thirdTxTransfer.wait();

      const firstHolderTokenSession = await ethers.getContractAt(
        tokenContractName,
        knnToken.address,
        firstHolder
      );

      const secondHolderTokenSession = await ethers.getContractAt(
        tokenContractName,
        knnToken.address,
        secondHolder
      );

      const thirdHolderTokenSession = await ethers.getContractAt(
        tokenContractName,
        knnToken.address,
        thirdHolder
      );

      const firstHolderYieldSession = await ethers.getContractAt(
        yieldContractName,
        knnYield.address,
        firstHolder
      );

      const secondHolderYieldSession = await ethers.getContractAt(
        yieldContractName,
        knnYield.address,
        secondHolder
      );

      const thirdHolderYieldSession = await ethers.getContractAt(
        yieldContractName,
        knnYield.address,
        thirdHolder
      );

      await firstHolderTokenSession.approve(knnYield.address, amount);
      await secondHolderTokenSession.approve(knnYield.address, amount);
      await thirdHolderTokenSession.approve(knnYield.address, amount);

      await knnYield.addReward(rewardAmount, rewardsDuration);
      await network.provider.send("evm_increaseTime", [1 * 24 * 60 ** 2]);
      await network.provider.send("evm_mine");

      await firstHolderYieldSession.subscribe(amount);
      await secondHolderYieldSession.subscribe(amount);
      await thirdHolderYieldSession.subscribe(amount);

      await network.provider.send("evm_increaseTime", [300 * 24 * 60 ** 2]);
      await network.provider.send("evm_mine");

      await firstHolderYieldSession.withdraw(halfWithdrawAmount);

      await network.provider.send("evm_increaseTime", [180 * 24 * 60 ** 2]);
      await network.provider.send("evm_mine");

      await secondHolderYieldSession.withdraw(halfWithdrawAmount);

      await network.provider.send("evm_increaseTime", [180 * 24 * 60 ** 2]);
      await network.provider.send("evm_mine");

      const firstExitTx = await firstHolderYieldSession.exit();
      const secondExitTx = await secondHolderYieldSession.exit();
      const thirdExitTx = await thirdHolderYieldSession.exit();
      await firstExitTx.wait();
      await secondExitTx.wait();
      await thirdExitTx.wait();

      const firstHolderBalance = await knnToken.balanceOf(firstHolder.address);
      const secondHolderBalance = await knnToken.balanceOf(
        secondHolder.address
      );

      const thirdHolderBalance = await knnToken.balanceOf(thirdHolder.address);

      const beforeCollect = await knnToken.balanceOf(deployerWallet.address);
      await network.provider.send("evm_mine");
      await knnYield.collectFees();
      await network.provider.send("evm_mine");
      const afterCollect = await knnToken.balanceOf(deployerWallet.address);
      await network.provider.send("evm_mine");

      console.info(
        "\nWITHDRAWN Earned KNN Rewards | 1st Holder =>",
        parseKNN(firstHolderBalance) - parseKNN(amount),
        "\nWITHDRAWN Earned KNN Rewards | 2nd Holder =>",
        parseKNN(secondHolderBalance) - parseKNN(amount),
        "\nWITHDRAWN Earned KNN Rewards | 3rd Holder =>",
        parseKNN(thirdHolderBalance) - parseKNN(amount),
        "\n| Collected =>",
        parseKNN(afterCollect) - parseKNN(beforeCollect)
      );
    });

    it("should reproduce a 5-Holder serial distribution", async () => {
      const timeSeries = 60;
      const interval = 1 * 60 * 60 * 24;
      const rewardsDuration = interval * timeSeries;

      const rewardAmount = parse1e18(600);

      // await knnToken.mint(rewardAmount);
      await knnTreasurer.release(knnYield.address, rewardAmount);

      await network.provider.send("evm_setAutomine", [false]);

      await knnYield.addReward(rewardAmount, rewardsDuration);

      const givenTokens: Record<string, number> = {};

      const increaseTime = async (
        timeToIncrease: number | undefined = interval
      ) => {
        await network.provider.send("evm_increaseTime", [timeToIncrease]);
        await network.provider.send("evm_mine");
      };

      const subscribe = async (holder: SignerWithAddress, amount: number) => {
        if (!givenTokens[holder.address]) givenTokens[holder.address] = 0;

        givenTokens[holder.address] += amount;

        const amount1e18 = parse1e18(amount);
        await knnTreasurer.release(holder.address, amount1e18);

        const scopedToken = await ethers.getContractAt(
          tokenContractName,
          knnToken.address,
          holder
        );

        await scopedToken.approve(knnYield.address, amount1e18);

        const scopedYield = await ethers.getContractAt(
          yieldContractName,
          knnYield.address,
          holder
        );

        await scopedYield.subscribe(amount1e18);
        await network.provider.send("evm_mine");
      };

      const withdraw = async (holder: SignerWithAddress, amount: number) => {
        // await exit(holder);
        const amount1e18 = parse1e18(amount);
        const scopedYield = await ethers.getContractAt(
          yieldContractName,
          knnYield.address,
          holder
        );

        await scopedYield.withdraw(amount1e18);
        await network.provider.send("evm_mine");
      };

      const exit = async (holder: SignerWithAddress) => {
        const scopedYield = await ethers.getContractAt(
          yieldContractName,
          knnYield.address,
          holder
        );

        await scopedYield.exit();
        await network.provider.send("evm_mine");
      };

      // SERIES 1 TO 60
      await subscribe(firstHolder, 100);
      await increaseTime(3 * interval);

      await subscribe(fourthHolder, 200);
      await increaseTime(interval);

      await subscribe(secondHolder, 200);
      await increaseTime(2 * interval);

      await subscribe(thirdHolder, 100); // Seg 7
      await increaseTime(interval);

      await subscribe(firstHolder, 200);
      await increaseTime(interval);

      await subscribe(thirdHolder, 100); // Seg 9
      await increaseTime(2 * interval);

      await subscribe(thirdHolder, 100); // Seg 11
      await increaseTime(interval);

      await exit(secondHolder); // Seg 12
      await increaseTime(2 * interval);

      await subscribe(thirdHolder, 200); // Seg 14
      await increaseTime(interval);

      await exit(firstHolder);
      await increaseTime(5 * interval); // Seg 15

      await subscribe(fifthHolder, 200); // Seg 20
      await increaseTime(7 * interval);

      await exit(fifthHolder); // 27
      await increaseTime(6 * interval);

      await withdraw(thirdHolder, 300); // Seg 30, partial withdraw
      await increaseTime(10 * interval);

      await subscribe(firstHolder, 100); // Seg 39
      await increaseTime(10 * interval);

      await exit(firstHolder);
      await increaseTime(10 * interval);

      // EXITS
      await exit(secondHolder);
      await exit(fourthHolder);
      await exit(thirdHolder);
      await exit(fifthHolder);
      await exit(firstHolder);

      // BALANCES
      const firstHolderBalance = await knnToken.balanceOf(firstHolder.address);
      const secondHolderBalance = await knnToken.balanceOf(
        secondHolder.address
      );
      const thirdHolderBalance = await knnToken.balanceOf(thirdHolder.address);
      const fourthHolderBalance = await knnToken.balanceOf(
        fourthHolder.address
      );

      const fifthHolderBalance = await knnToken.balanceOf(fifthHolder.address);

      const beforeCollect = await knnToken.balanceOf(deployerWallet.address);
      await network.provider.send("evm_mine");
      await knnYield.collectFees();
      await network.provider.send("evm_mine");
      const afterCollect = await knnToken.balanceOf(deployerWallet.address);
      await network.provider.send("evm_mine");

      expect(parseKNN(afterCollect)).to.greaterThan(parseKNN(beforeCollect));

      // DEBUG CONSOLES
      console.info(
        "\n| 1st Holder =>",
        parseKNN(firstHolderBalance) - givenTokens[firstHolder.address],
        "\n| 2nd Holder =>",
        parseKNN(secondHolderBalance) - givenTokens[secondHolder.address],
        "\n| 3rd Holder =>",
        parseKNN(thirdHolderBalance) - givenTokens[thirdHolder.address],
        "\n| 4th Holder =>",
        parseKNN(fourthHolderBalance) - givenTokens[fourthHolder.address],
        "\n| 5th Holder =>",
        parseKNN(fifthHolderBalance) - givenTokens[fifthHolder.address],
        "\n| Collected =>",
        parseKNN(afterCollect) - parseKNN(beforeCollect)
      );
    });
  });
});
