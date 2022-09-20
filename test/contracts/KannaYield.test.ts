import { ethers, network } from "hardhat";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import {
  KannaYield__factory,
  KannaYield,
  ERC20KannaToken,
} from "../../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

chai.use(chaiAsPromised);
const { expect } = chai;

const tokenContractName = "ERC20KannaToken";
const yieldContractName = "KannaYield";

const parseKNN = (bigNumberish: any): number =>
  parseFloat(ethers.utils.formatEther(bigNumberish).split(".")[0]);

const parse1e18 = (integer: number): string => `${integer}000000000000000000`;

describe("KNN Yield⬆", async () => {
  let knnToken: ERC20KannaToken;
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
    await knnToken.addRewardContract(knnYield.address);

    const tx400k = await knnToken.transfer(
      knnYield.address,
      "400000000000000000000000"
    );

    await tx400k.wait();
  });

  describe("KANNA Yield Tests", () => {
    it("should start with a 400K balance", async () => {
      const yieldBalance = await knnToken.balanceOf(knnYield.address);
      const balance = parseInt(yieldBalance._hex, 16);

      expect(balance).to.eq(4e23);
    });

    it("should allow user to subscribe for 2000.0 KNN", async () => {
      const subscriptionAmount = "200000000000000000000000";
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

      const rewardAmount = parse1e18(6000);

      await knnToken.transfer(knnYield.address, rewardAmount);

      const rewardTx = await knnYield.addReward(
        rewardAmount,
        1 * 60 * 60 * 24 * 90
      );

      await rewardTx.wait();

      const subscription = await yieldSession.subscribe(subscriptionAmount);
      await subscription.wait();

      const balance = await knnYield.balanceOf(anyHolder.address);

      const subscriptionFee = 200;

      const userBalanceOnPool =
        parseKNN(subscriptionAmount) -
        (parseKNN(subscriptionAmount) * subscriptionFee) / 100000;

      console.log(userBalanceOnPool);

      expect(parseKNN(balance)).to.eq(userBalanceOnPool);
    });

    it("should reproduce a 5-Holder serial distribution", async () => {
      // const timeSeries = 60;
      const rewardsDuration = 90 * 24 * 60 * 60;

      const rewardAmount = parse1e18(400000);

      await knnToken.transfer(knnYield.address, rewardAmount);

      await network.provider.send("evm_setAutomine", [false]);

      await knnYield.addReward(rewardAmount, rewardsDuration);

      const givenTokens: Record<string, number> = {};
      await network.provider.send("evm_mine");
      const increaseTime = async (
        timeToIncrease: number | undefined = 1 * 60 * 60 * 24 * 365 * 100000
      ) => {
        await network.provider.send("evm_increaseTime", [3 * 24 * 60 * 60]);
        await network.provider.send("evm_mine");
      };

      const subscribe = async (holder: SignerWithAddress, amount: number) => {
        if (!givenTokens[holder.address]) givenTokens[holder.address] = 0;

        givenTokens[holder.address] += amount;

        const amount1e18 = parse1e18(amount);
        await knnToken.transfer(holder.address, amount1e18);

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

        await network.provider.send("evm_mine");
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
      await subscribe(firstHolder, 10000);
      await increaseTime();
      await increaseTime();
      await increaseTime();

      await subscribe(fourthHolder, 20000);
      await increaseTime();

      await subscribe(secondHolder, 20000);
      await increaseTime();
      await increaseTime();

      await subscribe(thirdHolder, 10000); // Seg 7
      await increaseTime();

      await subscribe(firstHolder, 20000);
      await increaseTime();

      await subscribe(thirdHolder, 10000); // Seg 9
      await increaseTime();
      await increaseTime();

      await subscribe(thirdHolder, 10000); // Seg 11
      await increaseTime();

      await exit(secondHolder); // Seg 12
      await increaseTime();
      await increaseTime();

      await subscribe(thirdHolder, 20000); // Seg 14
      await increaseTime();

      await exit(firstHolder);
      await increaseTime(); // Seg 15

      await increaseTime();
      await increaseTime();
      await increaseTime();
      await increaseTime();

      await subscribe(fifthHolder, 20000); // Seg 20
      await increaseTime();

      await increaseTime();
      await increaseTime();
      await increaseTime();
      await increaseTime();
      await increaseTime();
      await increaseTime();

      await exit(fifthHolder); // 27
      await increaseTime();

      await increaseTime();
      await increaseTime();

      // await withdraw(thirdHolder, 30000); // Seg 30, partial withdraw
      await increaseTime();
      await increaseTime();
      await increaseTime();

      await increaseTime();
      await increaseTime();
      await increaseTime();
      await increaseTime();
      await increaseTime();
      await increaseTime();
      await increaseTime();
      await increaseTime();

      await subscribe(firstHolder, 10000); // Seg 39
      await increaseTime();

      await increaseTime();
      await increaseTime();
      await increaseTime();
      await increaseTime();
      await increaseTime();
      await increaseTime();
      await increaseTime();
      await increaseTime();
      await increaseTime();

      await exit(firstHolder);
      await increaseTime();

      await increaseTime();
      await increaseTime();
      await increaseTime();
      await increaseTime();
      await increaseTime();
      await increaseTime();
      await increaseTime();
      await increaseTime();
      await increaseTime();

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
      const poolBalance = await knnToken.balanceOf(knnYield.address);

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
        "\n| POOL =>",
        parseKNN(poolBalance)
      );
    });
  });
});
