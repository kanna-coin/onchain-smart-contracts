import { ethers, network } from "hardhat";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { KannaYield__factory, KannaYield, ERC20KannaToken } from "../typechain";

chai.use(chaiAsPromised);
const { expect } = chai;

const tokenContractName = "ERC20KannaToken";
const yieldContractName = "KannaYield";

const parseKNN = (bigNumberish: any): number =>
  parseInt(ethers.utils.formatEther(bigNumberish).split(".")[0], 10);

describe("KNN Yield⬆", async () => {
  let knnToken: ERC20KannaToken;
  let knnYield: KannaYield;

  const [
    deployerWallet,
    firstHolder,
    secondHolder,
    thirdHolder,
    fourthHolder,
    anyHolder,
  ] = await ethers.getSigners();

  beforeEach(async () => {
    const tokenFactory = await ethers.getContractFactory(
      tokenContractName,
      deployerWallet
    );

    knnToken = (await tokenFactory.deploy(
      deployerWallet.address
    )) as ERC20KannaToken;
    await knnToken.deployed();

    const yieldFactory = (await ethers.getContractFactory(
      yieldContractName,
      deployerWallet
    )) as KannaYield__factory;

    knnYield = (await yieldFactory.deploy(knnToken.address)) as KannaYield;

    await knnYield.deployed();

    const tx400k = await knnToken.transfer(
      knnYield.address,
      "400000000000000000000000"
    );

    await tx400k.wait();
  });

  describe("should initialize KNN Yield", async () => {
    it("should start with a 400K balance", async () => {
      const yieldBalance = await knnToken.balanceOf(knnYield.address);
      const balance = parseInt(yieldBalance._hex, 16);

      expect(balance).to.eq(4e23);
    });

    it("should allow user to subscribe for 200.0 KNN", async () => {
      const subscriptionAmount = "200000000000000000000";
      const txTransfer = await knnToken.transfer(
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

      const subscription = await yieldSession.subscribe(subscriptionAmount);
      await subscription.wait();

      const balance = await knnYield.balanceOf(anyHolder.address);

      expect(balance).to.eq(subscriptionAmount);
    });

    it("should distribute a 400K rewards over a yearly duration for a single holder", async () => {
      const rewardsDuration = 365 * 24 * 60 ** 2;

      const [firstAmount] = ["800000000000000000000000"];
      const rewardAmount = "400000000000000000000000";

      const txTransfer = await knnToken.transfer(
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

      let txApplyHoldersInterests = await knnYield.applyHoldersInterests([
        firstHolder.address,
      ]);

      await network.provider.send("evm_increaseTime", [rewardsDuration / 5]);
      await network.provider.send("evm_mine");

      txApplyHoldersInterests = await knnYield.applyHoldersInterests([
        firstHolder.address,
      ]);

      await network.provider.send("evm_increaseTime", [rewardsDuration / 5]);
      await network.provider.send("evm_mine");

      txApplyHoldersInterests = await knnYield.applyHoldersInterests([
        firstHolder.address,
      ]);

      await network.provider.send("evm_increaseTime", [rewardsDuration / 5]);
      await network.provider.send("evm_mine");

      txApplyHoldersInterests = await knnYield.applyHoldersInterests([
        firstHolder.address,
      ]);

      await network.provider.send("evm_increaseTime", [rewardsDuration / 5]);
      await network.provider.send("evm_mine");

      txApplyHoldersInterests = await knnYield.applyHoldersInterests([
        firstHolder.address,
      ]);
      await network.provider.send("evm_increaseTime", [rewardsDuration / 5]);
      await network.provider.send("evm_mine");

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

    it("should distribute a 400K rewards over a yearly duration for two holders accordingly", async () => {
      const rewardsDuration = 365 * 24 * 60 ** 2;

      const [firstAmount, secondAmount] = [
        "800000000000000000000000",
        "800000000000000000000000",
      ];
      const rewardAmount = "400000000000000000000000";

      await knnToken.mint("9000000000000000000000000");
      await knnToken.transfer(knnYield.address, rewardAmount);

      const firstTxTransfer = await knnToken.transfer(
        firstHolder.address,
        firstAmount
      );

      await firstTxTransfer.wait();

      const secondTxTransfer = await knnToken.transfer(
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

      let txApplyHoldersInterests = await knnYield.applyHoldersInterests([
        firstHolder.address,
        secondHolder.address,
      ]);

      await network.provider.send("evm_increaseTime", [rewardsDuration / 5]);
      await network.provider.send("evm_mine");

      txApplyHoldersInterests = await knnYield.applyHoldersInterests([
        firstHolder.address,
        secondHolder.address,
      ]);

      await network.provider.send("evm_increaseTime", [rewardsDuration / 5]);
      await network.provider.send("evm_mine");

      txApplyHoldersInterests = await knnYield.applyHoldersInterests([
        firstHolder.address,
        secondHolder.address,
      ]);

      await network.provider.send("evm_increaseTime", [rewardsDuration / 5]);
      await network.provider.send("evm_mine");

      const secondExitTx = await secondHolderYieldSession.exit();
      await secondExitTx.wait();

      txApplyHoldersInterests = await knnYield.applyHoldersInterests([
        firstHolder.address,
        secondHolder.address,
      ]);

      await network.provider.send("evm_increaseTime", [rewardsDuration / 5]);
      await network.provider.send("evm_mine");

      txApplyHoldersInterests = await knnYield.applyHoldersInterests([
        firstHolder.address,
        secondHolder.address,
      ]);
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

    it("should distribute a 400K rewards over a yearly duration for two holders in a half EQUALY", async () => {
      const rewardsDuration = 365 * 24 * 60 ** 2;

      const [firstAmount, secondAmount] = [
        "800000000000000000000000",
        "800000000000000000000000",
      ];
      const rewardAmount = "400000000000000000000000";

      await knnToken.mint("9000000000000000000000000");
      await knnToken.transfer(knnYield.address, rewardAmount);

      const firstTxTransfer = await knnToken.transfer(
        firstHolder.address,
        firstAmount
      );

      await firstTxTransfer.wait();

      const secondTxTransfer = await knnToken.transfer(
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

      let txApplyHoldersInterests = await knnYield.applyHoldersInterests([
        firstHolder.address,
        secondHolder.address,
      ]);

      await network.provider.send("evm_increaseTime", [rewardsDuration / 5]);
      await network.provider.send("evm_mine");

      txApplyHoldersInterests = await knnYield.applyHoldersInterests([
        firstHolder.address,
        secondHolder.address,
      ]);

      await network.provider.send("evm_increaseTime", [rewardsDuration / 5]);
      await network.provider.send("evm_mine");

      txApplyHoldersInterests = await knnYield.applyHoldersInterests([
        firstHolder.address,
        secondHolder.address,
      ]);

      await network.provider.send("evm_increaseTime", [rewardsDuration / 5]);
      await network.provider.send("evm_mine");

      txApplyHoldersInterests = await knnYield.applyHoldersInterests([
        firstHolder.address,
        secondHolder.address,
      ]);

      await network.provider.send("evm_increaseTime", [rewardsDuration / 5]);
      await network.provider.send("evm_mine");

      txApplyHoldersInterests = await knnYield.applyHoldersInterests([
        firstHolder.address,
        secondHolder.address,
      ]);
      await network.provider.send("evm_increaseTime", [rewardsDuration / 5]);
      await network.provider.send("evm_mine");

      const firstExitTx = await firstHolderYieldSession.exit();
      const secondExitTx = await secondHolderYieldSession.exit();
      await firstExitTx.wait();
      await secondExitTx.wait();

      const firstHolderBalance = await knnToken.balanceOf(firstHolder.address);
      const secondHolderBalance = await knnToken.balanceOf(
        secondHolder.address
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

      console.info(
        "Earned KNN Rewards | 1st Holder =>",
        parseKNN(firstHolderBalance) - parseKNN(firstAmount)
      );

      console.info(
        "Earned KNN Rewards | 2nd Holder =>",
        parseKNN(secondHolderBalance) - parseKNN(secondAmount)
      );
    });
  });
});
