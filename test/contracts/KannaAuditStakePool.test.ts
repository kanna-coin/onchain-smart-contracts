import { ethers, network } from 'hardhat';
import { Signer, BigNumber, BigNumberish, constants, utils } from 'ethers';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { MockContract } from 'ethereum-waffle';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { KannaAuditStakePool } from '../../typechain-types';
import { getKannaAuditStakePool, getKnnTokenMock, getKannaAuditScoreProviderMock } from '../../src/infrastructure/factories';

chai.use(chaiAsPromised);
const { expect } = chai;

const parseBigNumber = (value: number) => utils.parseEther(value.toString());
const toNumber = (value: BigNumberish) => +utils.formatEther(value.toString());

const hundred = parseBigNumber(100);

const stakes = [
  {
    totalPrize: parseBigNumber(2000),
    maxInStakePool: parseBigNumber(6000),
    maxPrizePercentage: 50,
    fee: parseBigNumber(2),
    minToStake: parseBigNumber(30),
    maxToStake: parseBigNumber(150),
    minDaysInStake: 30,
    feeDiscounts: [
      20, 25,
      50, 50,
      80, 100
    ],
    amountToSkate: parseBigNumber(6000),
  },
  {
    totalPrize: parseBigNumber(1000),
    maxInStakePool: parseBigNumber(8000),
    maxPrizePercentage: 20,
    fee: parseBigNumber(0.5),
    minToStake: parseBigNumber(20),
    maxToStake: parseBigNumber(100),
    minDaysInStake: 90,
    feeDiscounts: [
      20, 25,
      50, 50,
      80, 100
    ],
    amountToSkate: parseBigNumber(1000),
  },
];

type Stake = typeof stakes[number];

describe('Kanna Audit Stake Pool', () => {
  let signers: SignerWithAddress[];
  let auditStakePool: KannaAuditStakePool;
  let knnToken: MockContract;
  let scoreProvider: MockContract;

  const deployContracts = async () => {
    signers = await ethers.getSigners();

    const [deployerWallet] = signers;

    auditStakePool = await getKannaAuditStakePool(deployerWallet);
    knnToken = await getKnnTokenMock(deployerWallet);
    scoreProvider = await getKannaAuditScoreProviderMock(deployerWallet);

    await scoreProvider.mock.supportsInterface.returns(true);
  };

  const getSession = async (signer: Signer, stakeContract: KannaAuditStakePool = auditStakePool) => {
    const session = (await ethers.getContractAt(
      'KannaAuditStakePool',
      stakeContract.address,
      signer
    )) as KannaAuditStakePool;

    return session;
  };

  const getUserSession = async (stakeContract: KannaAuditStakePool = auditStakePool) => {
    const [, , userWallet] = signers;

    const session = await getSession(userWallet, stakeContract);

    return [session, userWallet] as const;
  };

  const getRandomWallet = async () => {
    const wallet = ethers.Wallet.createRandom();
    const userWallet = await ethers.getImpersonatedSigner(wallet.address);

    await network.provider.send("hardhat_setBalance", [
      userWallet.address,
      ethers.utils.hexStripZeros(
        ethers.utils.parseEther("10")._hex
      ),
    ]);

    return userWallet;
  };

  const initializeStakePool = async (stake: Stake) => {
    const [deployerWallet] = signers;

    await knnToken.mock.allowance.withArgs(deployerWallet.address, auditStakePool.address).returns(stake.totalPrize);
    await knnToken.mock.transferFrom.withArgs(deployerWallet.address, auditStakePool.address, stake.totalPrize).returns(true);

    await knnToken.mock.balanceOf.withArgs(auditStakePool.address).returns(stake.totalPrize);

    return await auditStakePool.initialize(
      knnToken.address,
      stake.totalPrize,
      stake.maxInStakePool,
      stake.maxPrizePercentage,
      stake.fee,
      stake.minToStake,
      stake.maxToStake,
      stake.minDaysInStake,
      stake.feeDiscounts
    );
  };

  const getRandomStakeAmount = (stake: Stake) => {
    const minToStake = toNumber(stake.minToStake);
    const maxToStake = toNumber(stake.maxToStake);

    return parseBigNumber(Math.floor(Math.random() * (maxToStake - minToStake + 1) + minToStake));
  };

  const calculateStakeFee = (stake: Stake, score: BigNumber) => {
    let fee = stake.fee;
    let percentage = 0;

    const numberScore = toNumber(score);

    for (let i = 0; i < stake.feeDiscounts.length; i += 2) {
      const _score = stake.feeDiscounts[i];
      const _percentage = stake.feeDiscounts[i + 1];

      if (numberScore < _score) {
        break;
      }

      percentage = _percentage;
    }

    return fee.mul(hundred.sub(parseBigNumber(percentage))).div(hundred);
  };

  const populateStakers = async (stake: Stake) => {
    const stakers = [];
    let stakeId = 0;

    while (true) {
      let totalStaked = await auditStakePool.totalStaked();

      const userWallet = await getRandomWallet();
      const session = await getSession(userWallet);

      let amount = getRandomStakeAmount(stake);

      if (totalStaked.add(amount).gt(stake.maxInStakePool)) {
        amount = stake.maxInStakePool.sub(totalStaked);

        if (amount.lt(stake.minToStake)) {
          await knnToken.mock.balanceOf.withArgs(auditStakePool.address).returns(stake.totalPrize.add(totalStaked));

          break;
        }
      }

      await knnToken.mock.allowance.withArgs(userWallet.address, auditStakePool.address).returns(amount);
      await knnToken.mock.transferFrom.withArgs(userWallet.address, auditStakePool.address, amount).returns(true);

      await session.stake(amount);

      const score = parseBigNumber(Math.floor(Math.random() * (100 + 1)));

      await scoreProvider.mock.getScore.withArgs(userWallet.address).returns(score);

      stakers.push({
        stakeId: ++stakeId,
        userWallet,
        amount,
        score,
        fee: calculateStakeFee(stake, score),
      });

      totalStaked = await auditStakePool.totalStaked();

      if (totalStaked.gte(stake.amountToSkate)) {
        await knnToken.mock.balanceOf.withArgs(auditStakePool.address).returns(stake.totalPrize.add(totalStaked));

        break;
      }
    }

    return stakers;
  };

  describe("Setup", async () => {
    beforeEach(async () => {
      await deployContracts();
    });

    for (const stake of stakes) {
      describe("Initialize", async () => {
        it("should initialize", async () => {
          const [deployerWallet] = signers;

          await knnToken.mock.allowance.withArgs(deployerWallet.address, auditStakePool.address).returns(stake.totalPrize);
          await knnToken.mock.transferFrom.withArgs(deployerWallet.address, auditStakePool.address, stake.totalPrize).returns(true);

          await expect(auditStakePool.initialize(
            knnToken.address,
            stake.totalPrize,
            stake.maxInStakePool,
            stake.maxPrizePercentage,
            stake.fee,
            stake.minToStake,
            stake.maxToStake,
            stake.minDaysInStake,
            stake.feeDiscounts
          ))
            .to.emit(auditStakePool, 'Initialized')
            .withArgs(
              knnToken.address,
              stake.totalPrize,
              stake.maxInStakePool,
              stake.maxPrizePercentage,
              stake.minToStake,
              stake.maxToStake,
              stake.fee,
              stake.minDaysInStake
            );

          const status = await auditStakePool.status();

          expect(status).to.eq(1);

          const settings = await auditStakePool.settings();

          expect({
            totalPrize: settings.totalPrize,
            maxInStakePool: settings.maxInStakePool,
            maxPrizePercentage: settings.maxPrizePercentage,
            minToStake: settings.minToStake,
            maxToStake: settings.maxToStake,
            fee: settings.fee,
            minDaysInStake: settings.minDaysInStake,
          }).to.eql({
            totalPrize: stake.totalPrize,
            maxInStakePool: stake.maxInStakePool,
            maxPrizePercentage: stake.maxPrizePercentage,
            minToStake: stake.minToStake,
            maxToStake: stake.maxToStake,
            fee: stake.fee,
            minDaysInStake: stake.minDaysInStake,
          });

          for (let i = 0; i < settings.feeDiscounts.length; i++) {
            const feeDiscount = settings.feeDiscounts[i];

            expect({
              score: feeDiscount.score,
              discount: feeDiscount.discount,
            }).to.eql({
              score: stake.feeDiscounts[i * 2],
              discount: stake.feeDiscounts[i * 2 + 1],
            });
          }
        });

        describe("should not initialize", async () => {
          it("when already initialized", async () => {
            const [deployerWallet] = signers;

            await knnToken.mock.allowance.withArgs(deployerWallet.address, auditStakePool.address).returns(stake.totalPrize);
            await knnToken.mock.transferFrom.withArgs(deployerWallet.address, auditStakePool.address, stake.totalPrize).returns(true);

            await auditStakePool.initialize(
              knnToken.address,
              stake.totalPrize,
              stake.maxInStakePool,
              stake.maxPrizePercentage,
              stake.fee,
              stake.minToStake,
              stake.maxToStake,
              stake.minDaysInStake,
              stake.feeDiscounts
            );

            await expect(auditStakePool.initialize(
              knnToken.address,
              stake.totalPrize,
              stake.maxInStakePool,
              stake.maxPrizePercentage,
              stake.fee,
              stake.minToStake,
              stake.maxToStake,
              stake.minDaysInStake,
              stake.feeDiscounts
            )).to.be.revertedWith("Contract is already initialized");
          });

          it("invalid token address", async () => {
            await expect(auditStakePool.initialize(
              constants.AddressZero,
              stake.totalPrize,
              stake.maxInStakePool,
              stake.maxPrizePercentage,
              stake.fee,
              stake.minToStake,
              stake.maxToStake,
              stake.minDaysInStake,
              stake.feeDiscounts
            )).to.be.revertedWith("Invalid token address");
          });

          it("when total prize is 0", async () => {
            await expect(auditStakePool.initialize(
              knnToken.address,
              0,
              stake.maxInStakePool,
              stake.maxPrizePercentage,
              stake.fee,
              stake.minToStake,
              stake.maxToStake,
              stake.minDaysInStake,
              stake.feeDiscounts
            )).to.be.revertedWith("Total Prize must be greater than 0");
          });

          it("when minToStake is 0", async () => {
            await expect(auditStakePool.initialize(
              knnToken.address,
              stake.totalPrize,
              stake.maxInStakePool,
              stake.maxPrizePercentage,
              stake.fee,
              0,
              stake.maxToStake,
              stake.minDaysInStake,
              stake.feeDiscounts
            )).to.be.revertedWith("Minimum to stake must be greater than 0");
          });

          it("when maxToStake lower than or equal minToStake", async () => {
            await expect(auditStakePool.initialize(
              knnToken.address,
              stake.totalPrize,
              stake.maxInStakePool,
              stake.maxPrizePercentage,
              stake.fee,
              stake.minToStake,
              stake.minToStake,
              stake.minDaysInStake,
              stake.feeDiscounts
            )).to.be.revertedWith("Maximum to stake must be greater than minStake");
          });

          it("when maxPrizePercentage is 0", async () => {
            await expect(auditStakePool.initialize(
              knnToken.address,
              stake.totalPrize,
              stake.maxInStakePool,
              0,
              stake.fee,
              stake.minToStake,
              stake.maxToStake,
              stake.minDaysInStake,
              stake.feeDiscounts
            )).to.be.revertedWith("Maximum prize percentage must be greater than 0");
          });

          it("when maxInStakePool is lower than minimium calculated prize", async () => {
            const minInStakePool = stake.totalPrize.mul(100).div(stake.maxPrizePercentage);

            await expect(auditStakePool.initialize(
              knnToken.address,
              stake.totalPrize,
              minInStakePool.sub(1),
              stake.maxPrizePercentage,
              stake.fee,
              stake.minToStake,
              stake.maxToStake,
              stake.minDaysInStake,
              stake.feeDiscounts
            )).to.be.revertedWith("Maximum in stake pool must be greater than total prize plus total prize percentage");
          });

          it("when minDaysInStake is 0", async () => {
            await expect(auditStakePool.initialize(
              knnToken.address,
              stake.totalPrize,
              stake.maxInStakePool,
              stake.maxPrizePercentage,
              stake.fee,
              stake.minToStake,
              stake.maxToStake,
              0,
              stake.feeDiscounts
            )).to.be.revertedWith("Min days in stake must be greater than 0");
          });

          it("fee is greater than minimun prize", async () => {
            const minPrize = stake.minToStake.mul(stake.maxPrizePercentage).div(100);

            await expect(auditStakePool.initialize(
              knnToken.address,
              stake.totalPrize,
              stake.maxInStakePool,
              stake.maxPrizePercentage,
              minPrize.add(1),
              stake.minToStake,
              stake.maxToStake,
              stake.minDaysInStake,
              stake.feeDiscounts
            )).to.be.revertedWith("Fee must be less than minimun prize");
          });

          it("when insufficient balance", async () => {
            const [deployerWallet] = signers;

            await knnToken.mock.allowance.withArgs(deployerWallet.address, auditStakePool.address).returns(stake.totalPrize);
            await knnToken.mock.transferFrom.withArgs(deployerWallet.address, auditStakePool.address, stake.totalPrize).revertsWithReason("ERC20: transfer amount exceeds balance");

            await expect(auditStakePool.initialize(
              knnToken.address,
              stake.totalPrize,
              stake.maxInStakePool,
              stake.maxPrizePercentage,
              stake.fee,
              stake.minToStake,
              stake.maxToStake,
              stake.minDaysInStake,
              stake.feeDiscounts
            )).to.be.revertedWith("Error to transfer tokens");
          });

          const invalidFeeDiscounts = [
            {
              feeDiscounts: [20, 25, 50, 50, 80],
              reason: "Fee discounts must be even"
            },
            {
              feeDiscounts: [0, 50],
              reason: "Score must be between 0 and 100"
            },
            {
              feeDiscounts: [101, 50],
              reason: "Score must be between 0 and 100"
            },
            {
              feeDiscounts: [
                10, 20,
                101, 50
              ],
              reason: "Score must be between 0 and 100"
            },
            {
              feeDiscounts: [10, 0],
              reason: "Fee discounts must be between 0 and 100"
            },
            {
              feeDiscounts: [10, 101],
              reason: "Fee discounts must be between 0 and 100"
            },
            {
              feeDiscounts: [
                10, 20,
                50, 101
              ],
              reason: "Fee discounts must be between 0 and 100"
            },
            {
              feeDiscounts: [
                20, 20,
                10, 50
              ],
              reason: "Fee discounts must be in ascending order"
            },
            {
              feeDiscounts: [
                10, 50,
                20, 30
              ],
              reason: "Fee discounts must be in ascending order"
            },
          ];

          for (const invalidFeeDiscount of invalidFeeDiscounts) {
            it("invalid feeDiscounts: " + invalidFeeDiscount.reason, async () => {
              const [deployerWallet] = signers;

              await knnToken.mock.allowance.withArgs(deployerWallet.address, auditStakePool.address).returns(stake.totalPrize);
              await knnToken.mock.transferFrom.withArgs(deployerWallet.address, auditStakePool.address, stake.totalPrize).returns(true);

              await expect(auditStakePool.initialize(
                knnToken.address,
                stake.totalPrize,
                stake.maxInStakePool,
                stake.maxPrizePercentage,
                stake.fee,
                stake.minToStake,
                stake.maxToStake,
                stake.minDaysInStake,
                invalidFeeDiscount.feeDiscounts
              )).to.be.revertedWith(invalidFeeDiscount.reason);
            });
          }
        });
      });

      describe("Finalize", async () => {
        it("should finalize", async () => {
          const [session, userWallet] = await getUserSession();

          await initializeStakePool(stake);

          const amount = getRandomStakeAmount(stake);

          await knnToken.mock.allowance.withArgs(userWallet.address, auditStakePool.address).returns(amount);
          await knnToken.mock.transferFrom.withArgs(userWallet.address, auditStakePool.address, amount).returns(true);

          await session.stake(amount);

          await scoreProvider.mock.getScore.withArgs(userWallet.address).returns(parseBigNumber(100));

          await auditStakePool.setScoreProvider(scoreProvider.address);
          const tx = await auditStakePool.finalize();

          const percentageReached = await auditStakePool.percentageReached();
          const blockTimestamp = (await ethers.provider.getBlock('latest')).timestamp;

          await expect(tx)
            .to.emit(auditStakePool, 'Finalized')
            .withArgs(percentageReached, blockTimestamp);

          const status = await auditStakePool.status();

          expect(status).to.eq(2);
        });

        describe("should not finalize", async () => {
          it("when not active", async () => {
            await expect(auditStakePool.finalize())
              .to.be.revertedWith("Contract is not active");
          });

          it("when score provider not set", async () => {
            await initializeStakePool(stake);

            await expect(auditStakePool.finalize())
              .to.be.revertedWith("Score provider not set");
          });
        });
      });

      describe("Score provider", async () => {
        it("should set", async () => {
          await initializeStakePool(stake);

          const tx = await auditStakePool.setScoreProvider(scoreProvider.address);

          const blockTimestamp = (await ethers.provider.getBlock('latest')).timestamp;

          await expect(tx)
            .to.emit(auditStakePool, 'ScoreProviderSet')
            .withArgs(
              scoreProvider.address,
              blockTimestamp
            );
        });

        describe("should not set", async () => {
          it("when not active", async () => {
            await expect(auditStakePool.setScoreProvider(scoreProvider.address))
              .to.be.revertedWith("Contract is not active");
          });

          it("when invalid score provider", async () => {
            await initializeStakePool(stake);

            const [deployerWallet] = signers;
            const scoreProvider = await getKannaAuditScoreProviderMock(deployerWallet);

            await scoreProvider.mock.supportsInterface.returns(false);

            await expect(auditStakePool.setScoreProvider(scoreProvider.address))
              .to.be.revertedWith("`scoreProvider` needs to implement `IKannaAuditScoreProvider` interface");
          });
        });
      });

      describe("Stake", async () => {
        beforeEach(async () => {
          await initializeStakePool(stake);
        });

        it("should stake", async () => {
          const [session, userWallet] = await getUserSession();

          const amount = getRandomStakeAmount(stake);

          await knnToken.mock.allowance.withArgs(userWallet.address, auditStakePool.address).returns(amount);
          await knnToken.mock.transferFrom.withArgs(userWallet.address, auditStakePool.address, amount).returns(true);

          const lastSkateId = await session.lastStakeId();

          const tx = await session.stake(amount);

          const blockTimestamp = (await ethers.provider.getBlock('latest')).timestamp;

          await expect(tx)
            .to.emit(session, 'NewStake')
            .withArgs(
              lastSkateId + 1,
              userWallet.address,
              amount,
              blockTimestamp
            );

          const userStake = await auditStakePool.stakeOf(userWallet.address);

          expect({
            wallet: userStake.wallet,
            amount: userStake.amount,
            timestamp: userStake.timestamp,
          }).to.eql({
            wallet: userWallet.address,
            amount: amount,
            timestamp: BigNumber.from(blockTimestamp),
          });
        });

        describe("should not stake", async () => {
          it("when not active", async () => {
            const [deployerWallet] = signers;

            const auditStakePool = await getKannaAuditStakePool(deployerWallet);
            const [session] = await getUserSession(auditStakePool);

            const amount = getRandomStakeAmount(stake);

            await expect(session.stake(amount))
              .to.be.revertedWith("Contract is not active");
          });

          it("when address already staked", async () => {
            const [session, userWallet] = await getUserSession();

            const amount = getRandomStakeAmount(stake);

            await knnToken.mock.allowance.withArgs(userWallet.address, auditStakePool.address).returns(amount);
            await knnToken.mock.transferFrom.withArgs(userWallet.address, auditStakePool.address, amount).returns(true);

            await session.stake(amount);

            await expect(session.stake(amount))
              .to.be.revertedWith("Address already staked");
          });

          it("when amount is lower than minToStake", async () => {
            const [session] = await getUserSession();

            await expect(session.stake(stake.minToStake.sub(1)))
              .to.be.revertedWith("Invalid amount to stake");
          });

          it("when amount is greater than maxToStake", async () => {
            const [session] = await getUserSession();

            await expect(session.stake(stake.maxToStake.add(1)))
              .to.be.revertedWith("Invalid amount to stake");
          });

          it("when steak pool reached it's maximum capacity", async () => {
            let i = 0;

            do {
              const totalStaked = await auditStakePool.totalStaked();

              const userWallet = await getRandomWallet();

              const amount = getRandomStakeAmount(stake);

              await knnToken.mock.allowance.withArgs(userWallet.address, auditStakePool.address).returns(amount);
              await knnToken.mock.transferFrom.withArgs(userWallet.address, auditStakePool.address, amount).returns(true);

              const session = await getSession(userWallet);

              if (totalStaked.add(amount).gt(stake.maxInStakePool)) {
                await expect(session.stake(amount)).
                  to.be.revertedWith("The steak pool reached it's maximum capacity");

                break;
              }

              await session.stake(amount);
            } while (true);
          });

          it("when insufficient balance", async () => {
            const [session, userWallet] = await getUserSession();

            const amount = getRandomStakeAmount(stake);

            await knnToken.mock.allowance.withArgs(userWallet.address, auditStakePool.address).returns(amount);
            await knnToken.mock.transferFrom.withArgs(userWallet.address, auditStakePool.address, amount).revertsWithReason("ERC20: transfer amount exceeds balance");

            await expect(session.stake(amount))
              .to.be.revertedWith("Error to transfer tokens");
          });
        });
      });

      describe("Withdraw", async () => {
        let stakers: Awaited<ReturnType<typeof populateStakers>>;

        beforeEach(async () => {
          await initializeStakePool(stake);
          await auditStakePool.setScoreProvider(scoreProvider.address);

          stakers = await populateStakers(stake);
        });

        it("should withdraw", async () => {
          await auditStakePool.finalize();

          await network.provider.send("evm_increaseTime", [stake.minDaysInStake * 24 * 60 ** 2]);
          await network.provider.send("evm_mine");

          for (const staker of stakers) {
            const session = await getSession(staker.userWallet);
            const availableToWithdraw = await auditStakePool.availableToWithdraw(staker.userWallet.address);

            await knnToken.mock.transfer.withArgs(staker.userWallet.address, availableToWithdraw).returns(true);

            const tx = await session.withdraw();

            const blockTimestamp = (await ethers.provider.getBlock('latest')).timestamp;

            await expect(tx)
              .to.emit(auditStakePool, "Withdraw")
              .withArgs(
                staker.stakeId,
                staker.userWallet.address,
                availableToWithdraw,
                staker.fee,
                blockTimestamp
              );
          }
        });

        describe("should revert", async () => {
          it("not finalized", async () => {
            const staker = stakers[0];
            const session = await getSession(staker.userWallet);

            await expect(session.withdraw())
              .to.revertedWith("Contract is not finalized");
          });

          it("already withdrawn", async () => {
            await auditStakePool.finalize();

            await network.provider.send("evm_increaseTime", [stake.minDaysInStake * 24 * 60 ** 2]);
            await network.provider.send("evm_mine");

            const staker = stakers[0];
            const session = await getSession(staker.userWallet);

            const availableToWithdraw = await auditStakePool.availableToWithdraw(staker.userWallet.address);

            await knnToken.mock.transfer.withArgs(staker.userWallet.address, availableToWithdraw).returns(true);

            await session.withdraw();

            await expect(session.withdraw())
              .to.revertedWith("Prize already withdrawn");
          });

          it("min days in stake not reached", async () => {
            await auditStakePool.finalize();

            const staker = stakers[0];
            const session = await getSession(staker.userWallet);

            await expect(session.withdraw())
              .to.revertedWith("Minimum days in stake not reached");
          });
        });
      });

      describe("Validate views", async () => {
        let stakers: Awaited<ReturnType<typeof populateStakers>>;
        let totalStaked: BigNumber;
        let percentageReached: BigNumber;

        beforeEach(async () => {
          await initializeStakePool(stake);
          stakers = await populateStakers(stake);

          totalStaked = await auditStakePool.totalStaked();
          percentageReached = parseBigNumber(0);

          for (const staker of stakers) {
            const stakePercentage = staker.amount.mul(hundred).div(totalStaked);
            const stakerPercentageReached = stakePercentage.mul(staker.score).div(hundred);

            percentageReached = percentageReached.add(stakerPercentageReached);
          }
        });

        it("check is staked", async () => {
          const isStaked = await auditStakePool.isStaked(stakers[0].userWallet.address);

          expect(isStaked).to.eq(true);

          const wallet = await getRandomWallet();

          const notStaked = await auditStakePool.isStaked(wallet.address);

          expect(notStaked).to.eq(false);
        });

        it("should return stake of", async () => {
          await auditStakePool.setScoreProvider(scoreProvider.address);

          for (const staker of stakers) {
            const stake = await auditStakePool.stakeOf(staker.userWallet.address);

            await expect({
              wallet: stake.wallet,
              amount: stake.amount,
            }).to.eql({
              wallet: staker.userWallet.address,
              amount: staker.amount,
            });
          }
        });

        it("should return score of", async () => {
          await auditStakePool.setScoreProvider(scoreProvider.address);

          for (const staker of stakers) {
            const score = await auditStakePool.scoreOf(staker.userWallet.address);

            await expect(staker.score).to.eq(score);
          }
        });

        it("score of should revert if in invalid range", async () => {
          await auditStakePool.setScoreProvider(scoreProvider.address);

          const staker = stakers[0];

          await scoreProvider.mock.getScore.withArgs(staker.userWallet.address).returns(parseBigNumber(101));

          await expect(auditStakePool.scoreOf(staker.userWallet.address))
            .to.revertedWith('Score must be between 0 and 100');
        });

        it("should calculate fee", async () => {
          await auditStakePool.setScoreProvider(scoreProvider.address);

          for (const staker of stakers) {
            const fee = await auditStakePool.feeOf(staker.userWallet.address);

            await expect(staker.fee).to.eq(fee);
          }
        });

        it("should calculate prize of", async () => {
          await auditStakePool.setScoreProvider(scoreProvider.address);

          for (const staker of stakers) {
            const stakePercentage = staker.amount.mul(hundred).div(totalStaked);
            const stakerPercentageReached = stakePercentage.mul(staker.score).div(hundred);
            const stakerFinalPercentage = stakerPercentageReached.mul(hundred).div(percentageReached);
            const maxPrize = staker.amount.mul(parseBigNumber(stake.maxPrizePercentage)).div(hundred);
            let expectedPrize = stake.totalPrize.mul(stakerFinalPercentage).div(hundred);

            if (expectedPrize.gt(maxPrize)) {
              expectedPrize = maxPrize;
            }

            const prize = await auditStakePool.prizeOf(staker.userWallet.address);

            await expect(expectedPrize).to.eq(prize);
          }
        });

        it("prize of should be 0 when score provider not set", async () => {
          for (const staker of stakers) {
            const prize = await auditStakePool.prizeOf(staker.userWallet.address);

            await expect(0).to.eq(prize);
          }
        });

        describe("available to withdraw", async () => {
          beforeEach(async () => {
            await auditStakePool.setScoreProvider(scoreProvider.address);
          });

          it("should calculate", async () => {
            await auditStakePool.finalize();

            await network.provider.send("evm_increaseTime", [stake.minDaysInStake * 24 * 60 ** 2]);
            await network.provider.send("evm_mine");

            for (const staker of stakers) {
              const prize = await auditStakePool.prizeOf(staker.userWallet.address);
              const availableToWithdraw = await auditStakePool.availableToWithdraw(staker.userWallet.address);

              const expectedAvailableToWithdraw = staker.amount.add(prize).sub(staker.fee);

              await expect(expectedAvailableToWithdraw).to.eq(availableToWithdraw);
            }
          });

          it("return 0 if not finalized", async () => {
            for (const staker of stakers) {
              const availableToWithdraw = await auditStakePool.availableToWithdraw(staker.userWallet.address);

              await expect(0).to.eq(availableToWithdraw);
            }
          });

          it("return 0 if before min days in stake", async () => {
            await auditStakePool.finalize();

            for (const staker of stakers) {
              const availableToWithdraw = await auditStakePool.availableToWithdraw(staker.userWallet.address);

              await expect(0).to.eq(availableToWithdraw);
            }
          });

          it("return 0 if already withdrawn", async () => {
            await auditStakePool.finalize();

            const staker = stakers[0];

            await network.provider.send("evm_increaseTime", [stake.minDaysInStake * 24 * 60 ** 2]);
            await network.provider.send("evm_mine");

            const session = await getSession(staker.userWallet);
            const availableToWithdraw = await auditStakePool.availableToWithdraw(staker.userWallet.address);

            await knnToken.mock.transfer.withArgs(staker.userWallet.address, availableToWithdraw).returns(true);

            await session.withdraw();

            const prize = await auditStakePool.availableToWithdraw(staker.userWallet.address);

            await expect(0).to.eq(prize);
          });
        });
      });

      describe("Transfer tokens leftover", async () => {
        beforeEach(async () => {
          await initializeStakePool(stake);
        });

        it("should transfer", async () => {
          const [deployerWallet] = signers;

          await auditStakePool.setScoreProvider(scoreProvider.address);
          await auditStakePool.finalize();

          const leftOver = await auditStakePool.tokensLeftover();

          await knnToken.mock.transfer.withArgs(deployerWallet.address, leftOver).returns(true);

          const tx = await auditStakePool.transferTokensLeftover(deployerWallet.address);

          const blockTimestamp = (await ethers.provider.getBlock('latest')).timestamp;

          await expect(tx)
            .to.emit(auditStakePool, 'LeftoverTransferred')
            .withArgs(
              deployerWallet.address,
              leftOver,
              blockTimestamp
            );
        });

        describe("should calc leftover", async () => {
          it("initial value", async () => {
            await auditStakePool.setScoreProvider(scoreProvider.address);
            await auditStakePool.finalize();

            const leftOver = await auditStakePool.tokensLeftover();

            await expect(leftOver).to.eq(stake.totalPrize);
          });

          it("with stakers", async () => {
            const stakers = await populateStakers(stake);
            const totalStaked = await auditStakePool.totalStaked();

            await auditStakePool.setScoreProvider(scoreProvider.address);
            await auditStakePool.finalize();

            let percentageReached = parseBigNumber(0);

            for (const staker of stakers) {
              const stakePercentage = staker.amount.mul(hundred).div(totalStaked);
              const stakerPercentageReached = stakePercentage.mul(staker.score).div(hundred);

              percentageReached = percentageReached.add(stakerPercentageReached);
            }

            let totalLeftover = await knnToken.balanceOf(auditStakePool.address);

            for (const staker of stakers) {
              const stakePercentage = staker.amount.mul(hundred).div(totalStaked);
              const stakerPercentageReached = stakePercentage.mul(staker.score).div(hundred);
              const stakerFinalPercentage = stakerPercentageReached.mul(hundred).div(percentageReached);
              const maxPrize = staker.amount.mul(parseBigNumber(stake.maxPrizePercentage)).div(hundred);

              let prize = stake.totalPrize.mul(stakerFinalPercentage).div(hundred);

              if (prize.gt(maxPrize)) {
                prize = maxPrize;
              }

              totalLeftover = totalLeftover.sub(staker.amount.add(prize).sub(staker.fee));
            }

            const leftover = await auditStakePool.tokensLeftover();

            await expect(leftover).to.eq(totalLeftover);
          });

          it("with stakers withdraw", async () => {
            const stakers = await populateStakers(stake);
            const totalStaked = await auditStakePool.totalStaked();

            await auditStakePool.setScoreProvider(scoreProvider.address);
            await auditStakePool.finalize();

            await network.provider.send("evm_increaseTime", [stake.minDaysInStake * 24 * 60 ** 2]);
            await network.provider.send("evm_mine");

            let percentageReached = parseBigNumber(0);

            for (const staker of stakers) {
              const stakePercentage = staker.amount.mul(hundred).div(totalStaked);
              const stakerPercentageReached = stakePercentage.mul(staker.score).div(hundred);

              percentageReached = percentageReached.add(stakerPercentageReached);
            }

            let totalLeftover = await knnToken.balanceOf(auditStakePool.address);

            for (const staker of stakers) {
              const stakePercentage = staker.amount.mul(hundred).div(totalStaked);
              const stakerPercentageReached = stakePercentage.mul(staker.score).div(hundred);
              const stakerFinalPercentage = stakerPercentageReached.mul(hundred).div(percentageReached);
              const maxPrize = staker.amount.mul(parseBigNumber(stake.maxPrizePercentage)).div(hundred);

              let prize = stake.totalPrize.mul(stakerFinalPercentage).div(hundred);

              if (prize.gt(maxPrize)) {
                prize = maxPrize;
              }

              const availableToWithdraw = staker.amount.add(prize).sub(staker.fee);

              if (Math.random() < 0.5) {
                await knnToken.mock.transfer.withArgs(staker.userWallet.address, availableToWithdraw).returns(true);

                const session = await getSession(staker.userWallet);

                await session.withdraw();
                continue;
              }

              totalLeftover = totalLeftover.sub(availableToWithdraw);
            }

            const leftover = await auditStakePool.tokensLeftover();

            await expect(leftover).to.eq(totalLeftover);
          });

          it("should not calc if not finalized", async () => {
            await expect(auditStakePool.tokensLeftover())
              .to.revertedWith("Contract is not finalized");
          });
        });

        describe("should not transfer", async () => {
          it("when not active", async () => {
            const [deployerWallet] = signers;

            await expect(auditStakePool.transferTokensLeftover(deployerWallet.address))
              .to.be.revertedWith("Contract is not finalized");
          });

          it("when invalid recipient", async () => {
            await auditStakePool.setScoreProvider(scoreProvider.address);
            await auditStakePool.finalize();

            await expect(auditStakePool.transferTokensLeftover(constants.AddressZero))
              .to.be.revertedWith("Invalid recipient address");
          });

          it("no tokens leftover to transfer", async () => {
            const [deployerWallet] = signers;

            await auditStakePool.setScoreProvider(scoreProvider.address);
            await auditStakePool.finalize();

            const leftOver = await auditStakePool.tokensLeftover();

            await knnToken.mock.transfer.withArgs(deployerWallet.address, leftOver).returns(true);
            await auditStakePool.transferTokensLeftover(deployerWallet.address)

            await knnToken.mock.balanceOf.withArgs(auditStakePool.address).returns(0);

            await expect(auditStakePool.transferTokensLeftover(deployerWallet.address))
              .to.be.revertedWith("No tokens leftover to transfer");
          });

          it("error in transfer", async () => {
            const [deployerWallet] = signers;

            await auditStakePool.setScoreProvider(scoreProvider.address);
            await auditStakePool.finalize();

            const leftOver = await auditStakePool.tokensLeftover();

            await knnToken.mock.transfer.withArgs(deployerWallet.address, leftOver).returns(false);
            await expect(auditStakePool.transferTokensLeftover(deployerWallet.address))
              .to.be.revertedWith("Error to transfer tokens");
          });
        });
      });
    }

    describe('should prevent not staker', () => {
      const revertWith = 'Wallet is not staked';

      it("get stake of", async () => {
        const wallet = ethers.Wallet.createRandom();

        await expect(auditStakePool.stakeOf(wallet.address)).to.revertedWith(revertWith);
      });

      it("get prize of", async () => {
        const wallet = ethers.Wallet.createRandom();

        await expect(auditStakePool.prizeOf(wallet.address)).to.revertedWith(revertWith);
      });

      it("get fee of", async () => {
        const wallet = ethers.Wallet.createRandom();

        await expect(auditStakePool.feeOf(wallet.address)).to.revertedWith(revertWith);
      });

      it("get score of", async () => {
        const wallet = ethers.Wallet.createRandom();

        await expect(auditStakePool.scoreOf(wallet.address)).to.revertedWith(revertWith);
      });

      it("get available to withdraw", async () => {
        const wallet = ethers.Wallet.createRandom();

        await expect(auditStakePool.availableToWithdraw(wallet.address)).to.revertedWith(revertWith);
      });

      it("withdraw", async () => {
        const [session] = await getUserSession();

        await expect(session.withdraw()).to.revertedWith(revertWith);
      });
    });

    describe('should prevent not owner', () => {
      const revertWith = 'Ownable: caller is not the owner';

      it("initialize", async () => {
        const stake = stakes[0];
        const [session] = await getUserSession();

        await expect(
          session.initialize(
            knnToken.address,
            stake.totalPrize,
            stake.maxInStakePool,
            stake.maxPrizePercentage,
            stake.fee,
            stake.minToStake,
            stake.maxToStake,
            stake.minDaysInStake,
            stake.feeDiscounts
          )
        ).to.revertedWith(revertWith);
      });

      it("finalize", async () => {
        const [session] = await getUserSession();

        await expect(
          session.finalize()
        ).to.revertedWith(revertWith);
      });

      it("set score provider", async () => {
        const [session] = await getUserSession();

        await expect(
          session.setScoreProvider(scoreProvider.address)
        ).to.revertedWith(revertWith);
      });

      it("transferLeftover", async () => {
        const [session, userWallet] = await getUserSession();

        await expect(
          session.transferTokensLeftover(userWallet.address)
        ).to.revertedWith(revertWith);
      });
    });
  });
});