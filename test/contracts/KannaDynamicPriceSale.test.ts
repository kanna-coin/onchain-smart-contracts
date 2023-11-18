import { ethers, network } from "hardhat";
import { BigNumber, BigNumberish } from "ethers";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { KannaToken, KannaDynamicPriceSale } from "../../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  getKnnToken,
  getKnnTreasurer,
  getKnnDynamicPriceSale,
  getKnnTokenMock,
  getKnnDynamicPriceSaleFactory,
} from "../../src/infrastructure/factories";

chai.use(chaiAsPromised);
const { expect } = chai;

const ref = "1";

const knnPriceInUSD = 0.6;
const ethPriceInUSD = 2_000;
const knnPriceInETH = knnPriceInUSD / ethPriceInUSD;

const knnPriceInUSDBigNumber = ethers.utils.parseEther(knnPriceInUSD.toString());
const ethPriceInUSDBigNumber = ethers.utils.parseEther(ethPriceInUSD.toString());
const knnPriceInETHBigNumber = ethers.utils.parseEther(knnPriceInETH.toString());

const CLAIM_TYPEHASH = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Claim(address recipient,uint256 amountInKNN,uint256 ref,uint256 nonce)"));
const BUY_TYPEHASH = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("BuyTokens(address recipient, uint256 knnPriceInUSD, uint16 incrementalNonce, uint256 dueDate, uint256 amountInETH, uint256 amountInETH, uint256 nonce)"));

const calculateKnn = (eth: BigNumber) => {
  const amountInUsd = eth.mul(ethPriceInUSDBigNumber);
  const amountInKNN = amountInUsd.div(knnPriceInUSDBigNumber);

  return {
    amountInUsd,
    amountInKNN
  };
};

const getRandomNonce = () => {
  const hex32nonce = ethers.utils.hexlify(ethers.utils.randomBytes(32));
  const uint256Nonce = ethers.BigNumber.from(hex32nonce).sub(ethers.BigNumber.from('1'));

  return uint256Nonce;
}

const claimHash = (address: string, amount: number, claimRef: string) => {
  const nonce = getRandomNonce();
  const messageHash = ethers.utils.keccak256(
    ethers.utils.defaultAbiCoder.encode(
      ['bytes32', 'address', 'uint256', 'uint256', 'uint256'],
      [CLAIM_TYPEHASH, address, amount, claimRef, nonce]
    )
  );

  return [messageHash, nonce];
};

const buyHash = (address: string, knnPriceInUSD: BigNumberish, incrementalNonce: BigNumberish, dueDate: BigNumberish, amountInETH: BigNumberish, amountInKNN: BigNumberish) => {
  const nonce = getRandomNonce();
  const messageHash = ethers.utils.keccak256(
    ethers.utils.defaultAbiCoder.encode(
      ['bytes32', 'address', 'uint256', 'uint16', 'uint256', 'uint256', 'uint256', 'uint256'],
      [BUY_TYPEHASH, address, knnPriceInUSD, incrementalNonce, dueDate, amountInETH, amountInKNN, nonce]
    )
  );

  return [messageHash, nonce];
};

describe("KNN Dynamic Price Sale", () => {
  let signers: SignerWithAddress[];
  let knnToken: KannaToken;
  let knnTreasurer: KannaToken | undefined;
  let knnSale: KannaDynamicPriceSale;

  const deployContracts = async () => {
    signers = await ethers.getSigners();

    const [deployerWallet, , , treasuryWallet] = signers;

    knnToken = await getKnnToken(deployerWallet, treasuryWallet);

    knnTreasurer = await getKnnTreasurer(knnToken);

    knnSale = await getKnnDynamicPriceSale(deployerWallet, knnToken, knnTreasurer);
  };

  const getDeployerWallet = async () => {
    const [deployerWallet] = signers;

    return deployerWallet;
  };

  const getUserWallet = async () => {
    const [, , userAccount] = signers;

    return userAccount;
  };

  const getTreasuryWallet = async () => {
    const [, , , treasuryWallet] = signers;

    return treasuryWallet;
  };

  const getManagerSession = async (): Promise<
    [SignerWithAddress, KannaDynamicPriceSale]
  > => {
    const [, managerWallet] = signers;

    await knnSale.addClaimManager(managerWallet.address);

    const managerSession = (await ethers.getContractAt(
      "KannaDynamicPriceSale",
      knnSale.address,
      managerWallet
    )) as KannaDynamicPriceSale;

    return [managerWallet, managerSession];
  };

  const getUserSession = async (): Promise<
    [SignerWithAddress, KannaDynamicPriceSale]
  > => {
    const userWallet = await getUserWallet();

    const managerSession = (await ethers.getContractAt(
      "KannaDynamicPriceSale",
      knnSale.address,
      userWallet
    )) as KannaDynamicPriceSale;

    return [userWallet, managerSession];
  };

  describe("Setup", async () => {
    beforeEach(async () => {
      await deployContracts();
    });

    it("should initialize KNN Sale with amount of 50K tokens", async () => {
      const tokensToSell = await knnToken.balanceOf(knnSale.address);
      const balance = parseInt(tokensToSell._hex, 16);

      expect(balance).to.greaterThanOrEqual(5e22);
    });

    it("should not initialize KNN Sale with invalid token address", async () => {
      const deployerWallet = await getDeployerWallet();

      const knnSaleFactory = await getKnnDynamicPriceSaleFactory(deployerWallet);

      await expect(
        knnSaleFactory.deploy(ethers.constants.AddressZero)
      ).to.be.revertedWith("Invalid token address");
    });

    it("should buy KNN tokens", async () => {
      const [managerAccount] = await getManagerSession();
      const deployerWallet = await getDeployerWallet();

      await network.provider.send("hardhat_setBalance", [
        deployerWallet.address,
        "0xFFFFFFFFFFFFFFFF",
      ]);
      await network.provider.send("evm_mine");

      const availableSupply = await knnSale.availableSupply();

      const [incrementalNonce, dueDate] = await knnSale.getNonceAndDueDate(deployerWallet.address, 120);

      const eth = ethers.utils.parseEther("1.001001999238");
      const { amountInKNN } = calculateKnn(eth);

      const [messageHash, nonce] = buyHash(
        deployerWallet.address,
        knnPriceInUSDBigNumber,
        incrementalNonce,
        dueDate,
        eth,
        amountInKNN
      );

      const signature = await managerAccount.signMessage(ethers.utils.arrayify(messageHash));

      await expect(knnSale.buyTokens(
        deployerWallet.address,
        knnPriceInUSDBigNumber,
        signature,
        incrementalNonce,
        dueDate,
        nonce,
        amountInKNN,
        { value: eth }
      ))
        .to.emit(knnSale, "Purchase")
        .withArgs(
          deployerWallet.address,
          eth,
          knnPriceInUSDBigNumber,
          knnPriceInUSDBigNumber.mul(eth).div(amountInKNN), // Wrong value
          amountInKNN
        );

      const tokensToSell = await knnToken.balanceOf(knnSale.address);

      expect(tokensToSell).eq(availableSupply.sub(amountInKNN));
    });

    describe("should not buy KNN tokens", async () => {

      it("when amount is lower than USD_AGGREGATOR_DECIMALS", async () => {
        const [managerAccount] = await getManagerSession();
        const deployerWallet = await getDeployerWallet();
        const invalidValue = 1e8 - 1;

        const [incrementalNonce, dueDate] = await knnSale.getNonceAndDueDate(deployerWallet.address, 120);

        const eth = ethers.BigNumber.from(invalidValue);
        const { amountInKNN } = calculateKnn(eth);

        const [messageHash, nonce] = buyHash(
          deployerWallet.address,
          knnPriceInUSDBigNumber,
          incrementalNonce,
          dueDate,
          eth,
          amountInKNN
        );

        const signature = await managerAccount.signMessage(ethers.utils.arrayify(messageHash));

        const tx = knnSale.buyTokens(
          deployerWallet.address,
          knnPriceInUSDBigNumber,
          signature,
          incrementalNonce,
          dueDate,
          nonce,
          amountInKNN,
          { value: eth }
        )

        await expect(tx).to.be.revertedWith(
          "Invalid amount"
        );
      });

      it("when amount is greater than available supply", async () => {
        const [managerAccount] = await getManagerSession();
        const deployerWallet = await getDeployerWallet();

        const balance = await knnSale.availableSupply();

        const eth = balance.add(1).mul(knnPriceInETHBigNumber);

        await network.provider.send("hardhat_setBalance", [
          deployerWallet.address,
          ethers.utils.hexStripZeros(eth.add(ethers.utils.parseEther('1'))._hex),
        ]);
        await network.provider.send("evm_mine");

        const [incrementalNonce, dueDate] = await knnSale.getNonceAndDueDate(deployerWallet.address, 120);

        const { amountInKNN } = calculateKnn(eth);

        const [messageHash, nonce] = buyHash(
          deployerWallet.address,
          knnPriceInUSDBigNumber,
          incrementalNonce,
          dueDate,
          eth,
          amountInKNN
        );

        const signature = await managerAccount.signMessage(ethers.utils.arrayify(messageHash));

        const tx = knnSale.buyTokens(
          deployerWallet.address,
          knnPriceInUSDBigNumber,
          signature,
          incrementalNonce,
          dueDate,
          nonce,
          amountInKNN,
          { value: eth }
        )

        await expect(tx).to.be.revertedWith(
          "Insufficient supply!"
        );
      });

      it("when KNN transfer fail", async () => {
        const deployerWallet = await getDeployerWallet();
        const treasuryWallet = await getTreasuryWallet();
        const mockToken = await getKnnTokenMock(deployerWallet, treasuryWallet);
        const [managerAccount] = await getManagerSession();

        await mockToken.mock.transfer.reverts();

        const knnSaleWithMock = await getKnnDynamicPriceSale(
          deployerWallet,
          mockToken,
          knnTreasurer
        );

        const eth = ethers.utils.parseEther("1.001001999238");

        const [incrementalNonce, dueDate] = await knnSale.getNonceAndDueDate(deployerWallet.address, 120);
        const { amountInKNN } = calculateKnn(eth);

        const [messageHash, nonce] = buyHash(
          deployerWallet.address,
          knnPriceInUSDBigNumber,
          incrementalNonce,
          dueDate,
          eth,
          amountInKNN
        );

        const signature = await managerAccount.signMessage(ethers.utils.arrayify(messageHash));

        await expect(knnSaleWithMock.buyTokens(
          deployerWallet.address,
          knnPriceInUSDBigNumber,
          signature,
          incrementalNonce,
          dueDate,
          nonce,
          amountInKNN,
          { value: eth }
        )).to.be
          .reverted;
      });

      it("when invalid incremental nonce", async () => {
        const [managerAccount] = await getManagerSession();
        const deployerWallet = await getDeployerWallet();

        await network.provider.send("hardhat_setBalance", [
          deployerWallet.address,
          "0xFFFFFFFFFFFFFFFF",
        ]);
        await network.provider.send("evm_mine");

        let [incrementalNonce, dueDate] = await knnSale.getNonceAndDueDate(deployerWallet.address, 120);

        const eth = ethers.utils.parseEther("1.001001999238");
        const { amountInKNN } = calculateKnn(eth);

        const [messageHash, nonce] = buyHash(
          deployerWallet.address,
          knnPriceInUSDBigNumber,
          incrementalNonce.add(1),
          dueDate,
          eth,
          amountInKNN
        );

        const signature = await managerAccount.signMessage(ethers.utils.arrayify(messageHash));

        await expect(knnSale.buyTokens(
          deployerWallet.address,
          knnPriceInUSDBigNumber,
          signature,
          incrementalNonce.add(1),
          dueDate,
          nonce,
          amountInKNN,
          { value: eth }
        )).to.revertedWith("Invalid Nonce");
      });

      it("when nonce is already used", async () => {
        const [managerAccount] = await getManagerSession();
        const deployerWallet = await getDeployerWallet();

        await network.provider.send("hardhat_setBalance", [
          deployerWallet.address,
          "0xFFFFFFFFFFFFFFFF",
        ]);
        await network.provider.send("evm_mine");

        const [incrementalNonce, dueDate] = await knnSale.getNonceAndDueDate(deployerWallet.address, 120);

        const eth = ethers.utils.parseEther("1.001001999238");
        const { amountInKNN } = calculateKnn(eth);

        const [messageHash, nonce] = buyHash(
          deployerWallet.address,
          knnPriceInUSDBigNumber,
          incrementalNonce,
          dueDate,
          eth,
          amountInKNN
        );

        const signature = await managerAccount.signMessage(ethers.utils.arrayify(messageHash));

        await knnSale.buyTokens(
          deployerWallet.address,
          knnPriceInUSDBigNumber,
          signature,
          incrementalNonce,
          dueDate,
          nonce,
          amountInKNN,
          { value: eth }
        );

        await expect(knnSale.buyTokens(
          deployerWallet.address,
          knnPriceInUSDBigNumber,
          signature,
          incrementalNonce,
          dueDate,
          nonce,
          amountInKNN,
          { value: eth }
        )).to.revertedWith("Nonce already used");
      });

      it("when signature is exipired", async () => {
        const [managerAccount] = await getManagerSession();
        const deployerWallet = await getDeployerWallet();

        await network.provider.send("hardhat_setBalance", [
          deployerWallet.address,
          "0xFFFFFFFFFFFFFFFF",
        ]);
        await network.provider.send("evm_mine");

        const [incrementalNonce, dueDate] = await knnSale.getNonceAndDueDate(deployerWallet.address, 120);

        const eth = ethers.utils.parseEther("1.001001999238");
        const { amountInKNN } = calculateKnn(eth);

        const [messageHash, nonce] = buyHash(
          deployerWallet.address,
          knnPriceInUSDBigNumber,
          incrementalNonce,
          dueDate,
          eth,
          amountInKNN
        );

        const signature = await managerAccount.signMessage(ethers.utils.arrayify(messageHash));

        await network.provider.request({
          method: 'evm_increaseTime',
          params: [120 + 1],
        });
        await network.provider.send("evm_mine");

        await expect(knnSale.buyTokens(
          deployerWallet.address,
          knnPriceInUSDBigNumber,
          signature,
          incrementalNonce,
          dueDate,
          nonce,
          amountInKNN,
          { value: eth }
        )).to.revertedWith('Signature is expired');
      });
    });

    it("should lock supply", async () => {
      const [, managerSession] = await getManagerSession();

      const balance = await knnToken.balanceOf(knnSale.address);

      const toLock = 1e10;

      await expect(managerSession.lockSupply(toLock, ref))
        .to.emit(managerSession, "Lock")
        .withArgs(ref, toLock);

      let availableSupply = await knnSale.availableSupply();

      let expectedSupply = balance.sub(toLock);

      expect(availableSupply).to.eq(expectedSupply);

      await expect(managerSession.lockSupply(toLock, ref))
        .to.emit(managerSession, "Lock")
        .withArgs(ref, toLock);

      availableSupply = await knnSale.availableSupply();

      expectedSupply = expectedSupply.sub(toLock);

      expect(availableSupply).to.eq(expectedSupply);
    });

    describe("should not lock", async () => {
      it("when supply greater than supply", async () => {
        const [, managerSession] = await getManagerSession();

        const availableSupply = await knnSale.availableSupply();

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

        await knnSale.removeClaimManager(managerAccount.address);

        await expect(managerSession.lockSupply(amount, ref)).to.be.reverted;
      });
    });

    it("should unlock supply", async () => {
      const [, managerSession] = await getManagerSession();

      const balance = await knnToken.balanceOf(knnSale.address);

      const toLock = 1e10;

      await managerSession.lockSupply(toLock, ref);

      let expectedSupply = balance.sub(toLock);

      const firstUnlock = 1e9;

      await expect(managerSession.unlockSupply(firstUnlock, ref))
        .to.emit(managerSession, "Unlock")
        .withArgs(ref, firstUnlock);

      expectedSupply = expectedSupply.add(firstUnlock);

      let availableSupply = await knnSale.availableSupply();

      expect(availableSupply).to.eq(expectedSupply);

      const secondUnlock = 5 * 1e9;

      await expect(managerSession.unlockSupply(secondUnlock, ref))
        .to.emit(managerSession, "Unlock")
        .withArgs(ref, secondUnlock);

      expectedSupply = expectedSupply.add(secondUnlock);

      availableSupply = await knnSale.availableSupply();

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

        await knnSale.removeClaimManager(managerAccount.address);

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
          to: knnSale.address,
          value: ethers.utils.parseEther("5.001001999238"),
        })
      ).to.be.reverted;
    });

    it("should invoke the fallback function", async () => {
      const deployerWallet = await getDeployerWallet();

      const nonExistentFuncSignature = "nonExistentFunc(uint256,uint256)";
      const fakeDemoContract = new ethers.Contract(
        knnSale.address,
        [
          ...knnSale.interface.fragments,
          `function ${nonExistentFuncSignature}`,
        ],
        deployerWallet
      );

      await expect(fakeDemoContract[nonExistentFuncSignature](8, 9)).to.be
        .reverted;
    });

    it("should allow claim locked random nonce", async () => {
      const [managerAccount, managerSession] = await getManagerSession();
      const [userAccount, userSession] = await getUserSession();

      const amount = 1;

      await managerSession.lockSupply(amount, ref);

      const [messageHash, nonce] = claimHash(userAccount.address, amount, ref);

      const signature = await managerAccount.signMessage(ethers.utils.arrayify(messageHash));

      await expect(userSession.claimLocked(userAccount.address, amount, ref, signature, nonce))
        .to.emit(userSession, "Claim")
        .withArgs(userAccount.address, ref, amount);

      const balanceUint256 = await knnToken.balanceOf(userAccount.address);
      const balance = parseInt(balanceUint256._hex, 16);

      expect(balance).to.eq(amount);
    });

    it("should allow claim locked", async () => {
      const [managerAccount, managerSession] = await getManagerSession();
      const [userAccount, userSession] = await getUserSession();

      const amount = 1;

      await managerSession.lockSupply(amount, ref);

      const [messageHash, nonce] = claimHash(userAccount.address, amount, ref);
      const signature = await managerAccount.signMessage(ethers.utils.arrayify(messageHash));

      await expect(userSession.claimLocked(userAccount.address, amount, ref, signature, nonce))
        .to.emit(userSession, "Claim")
        .withArgs(userAccount.address, ref, amount);

      const balanceUint256 = await knnToken.balanceOf(userAccount.address);
      const balance = parseInt(balanceUint256._hex, 16);

      expect(balance).to.eq(amount);
    });

    it("should allow claim", async () => {
      const [, managerSession] = await getManagerSession();
      const userAccount = await getUserWallet();

      const amount = 1;

      await expect(
        managerSession.claim(userAccount.address, amount, ref)
      )
        .to.emit(managerSession, "Claim")
        .withArgs(userAccount.address, ref, amount);

      const balanceUint256 = await knnToken.balanceOf(userAccount.address);
      const balance = parseInt(balanceUint256._hex, 16);

      expect(balance).to.eq(amount);
    });

    describe("should not claim", async () => {
      it("to invalid recipient address", async () => {
        const [, managerSession] = await getManagerSession();
        const amount = 1;

        await expect(
          managerSession.claim(ethers.constants.AddressZero, amount, ref)
        ).to.be.revertedWith("Invalid address");
      });

      it("already claimed ref", async () => {
        const [, managerSession] = await getManagerSession();
        const userAccount = await getUserWallet();

        const amount = 1;

        await expect(
          managerSession.claim(userAccount.address, amount, ref)
        )
          .to.emit(managerSession, "Claim")
          .withArgs(userAccount.address, ref, amount);

        await expect(
          managerSession.claim(userAccount.address, amount, ref)
        ).to.be.revertedWith("Already claimed");
      });

      it("when claimable amount greater available supply", async () => {
        const [, managerSession] = await getManagerSession();
        const userAccount = await getUserWallet();

        const availableSupply = await knnSale.availableSupply();

        const amount = availableSupply.add(1);

        await expect(
          managerSession.claim(userAccount.address, amount, ref)
        ).to.be.revertedWith("Insufficient available supply");
      });

      it("when empty amount", async () => {
        const [, managerSession] = await getManagerSession();
        const userAccount = await getUserWallet();
        const amount = 0;

        await expect(
          managerSession.claim(userAccount.address, amount, ref)
        ).to.be.revertedWith("Invalid amount");
      });

      it("when invalid CLAIM_MANAGER_ROLE", async () => {
        const [managerAccount, managerSession] = await getManagerSession();
        const userAccount = await getUserWallet();
        const amount = 1;

        await knnSale.removeClaimManager(managerAccount.address);

        await expect(
          managerSession.claim(userAccount.address, amount, ref)
        ).to.be.reverted;
      });
    });

    describe("should not claim locked", async () => {
      it("when claimable amount greater than locked", async () => {
        const [managerAccount, managerSession] = await getManagerSession();
        const userAccount = await getUserWallet();
        const amount = 1;

        const [messageHash, nonce] = claimHash(userAccount.address, amount, ref);
        const signature = await managerAccount.signMessage(ethers.utils.arrayify(messageHash));

        await expect(
          managerSession.claimLocked(userAccount.address, amount, ref, signature, nonce)
        ).to.be.revertedWith("Insufficient locked amount");
      });

      it("when invalid CLAIM_MANAGER_ROLE", async () => {
        const [managerAccount, managerSession] = await getManagerSession();
        const userAccount = await getUserWallet();
        const amount = 1;

        await knnSale.removeClaimManager(managerAccount.address);

        const [messageHash, nonce] = claimHash(userAccount.address, amount, ref);
        const signature = await managerAccount.signMessage(ethers.utils.arrayify(messageHash));

        await expect(
          managerSession.claimLocked(userAccount.address, amount, ref, signature, nonce)
        ).to.be.reverted;
      });
    });

    describe("should not claim locked with signature", async () => {
      it("when claimable amount greater than locked", async () => {
        const [managerAccount] = await getManagerSession();
        const [userAccount, userSession] = await getUserSession();
        const amount = 1;

        const [messageHash, nonce] = claimHash(userAccount.address, amount, ref);
        const signature = await managerAccount.signMessage(ethers.utils.arrayify(messageHash));

        await expect(
          userSession.claimLocked(userAccount.address, amount, ref, signature, nonce)
        ).to.be.revertedWith("Insufficient locked amount");
      });

      it("when not positive amount", async () => {
        const [managerAccount] = await getManagerSession();
        const [userAccount, userSession] = await getUserSession();
        const amount = 0;

        const [messageHash, nonce] = claimHash(userAccount.address, amount, ref);
        const signature = await managerAccount.signMessage(ethers.utils.arrayify(messageHash));

        await expect(
          userSession.claimLocked(userAccount.address, amount, ref, signature, nonce)
        ).to.be.revertedWith("Invalid amount");
      });

      it("when invalid signature length", async () => {
        const [, managerSession] = await getManagerSession();
        const [userAccount, userSession] = await getUserSession();
        const amount = 1;

        await managerSession.lockSupply(amount, ref);

        await expect(
          userSession.claimLocked(userAccount.address, amount, ref, "0x01", "1")
        ).to.be.revertedWith("ECDSA: invalid signature length");
      });

      it("when invalid CLAIM_MANAGER_ROLE", async () => {
        const [userAccount, userSession] = await getUserSession();
        const amount = 1;

        const [messageHash, nonce] = claimHash(userAccount.address, amount, ref);
        const signature = await userAccount.signMessage(ethers.utils.arrayify(messageHash));

        await expect(
          userSession.claimLocked(userAccount.address, amount, ref, signature, nonce)
        ).to.be.reverted;
      });
    });

    it("should withdraw contract ETH", async () => {
      const [managerAccount] = await getManagerSession();
      const userAccount = await getUserWallet();

      const [incrementalNonce, dueDate] = await knnSale.getNonceAndDueDate(userAccount.address, 120);

      const eth = ethers.utils.parseEther("1.001001999238");
      const { amountInKNN } = calculateKnn(eth);

      const [messageHash, nonce] = buyHash(
        userAccount.address,
        knnPriceInUSDBigNumber,
        incrementalNonce,
        dueDate,
        eth,
        amountInKNN
      );

      const signature = await managerAccount.signMessage(ethers.utils.arrayify(messageHash));

      await knnSale.buyTokens(
        userAccount.address,
        knnPriceInUSDBigNumber,
        signature,
        incrementalNonce,
        dueDate,
        nonce,
        amountInKNN,
        { value: eth }
      )

      const userBalance = await ethers.provider.getBalance(userAccount.address);
      const saleBalance = await ethers.provider.getBalance(
        knnSale.address
      );

      await expect(knnSale.withdraw(userAccount.address))
        .to.emit(knnSale, "Withdraw")
        .withArgs(userAccount.address, saleBalance);

      const expetedUserBalance = userBalance.add(saleBalance);
      const newUserBalance = await ethers.provider.getBalance(
        userAccount.address
      );

      expect(newUserBalance).to.equal(expetedUserBalance);

      const newSaleBalance = await ethers.provider.getBalance(
        knnSale.address
      );

      expect(newSaleBalance).to.equal(0);
    });

    it("should end contract", async () => {
      const userAccount = await getUserWallet();

      const userBalance = await knnToken.balanceOf(userAccount.address);
      const availableSupply = await knnSale.availableSupply();

      knnSale.end(userAccount.address);

      const newAvailableSupply = await knnSale.availableSupply();

      expect(newAvailableSupply).to.equal(0);

      const newUserBalance = await knnToken.balanceOf(userAccount.address);
      const expetedUserBalance = userBalance.add(availableSupply);

      expect(newUserBalance).to.equal(expetedUserBalance);
    });

    it("should end contract without availableSupply", async () => {
      const [, managerSession] = await getManagerSession();
      const userAccount = await getUserWallet();

      const userBalance = await knnToken.balanceOf(userAccount.address);
      const availableSupply = await knnSale.availableSupply();

      await managerSession.lockSupply(availableSupply, ref);

      const newAvailableSupply = await knnSale.availableSupply();

      expect(newAvailableSupply).to.equal(0);

      knnSale.end(userAccount.address);

      const newUserBalance = await knnToken.balanceOf(userAccount.address);

      expect(newUserBalance).to.equal(userBalance);
    });

    describe("should prevent not owner", () => {
      const revertWith = "Ownable: caller is not the owner";

      it("add claim manager", async () => {
        const [, userSession] = await getUserSession();

        await expect(userSession.addClaimManager(ethers.constants.AddressZero))
          .to.be.revertedWith(revertWith);
      });

      it("remove claim manager", async () => {
        const [, userSession] = await getUserSession();

        await expect(userSession.removeClaimManager(ethers.constants.AddressZero))
          .to.be.revertedWith(revertWith);
      });

      it("withdraw contract ETH", async () => {
        const [, userSession] = await getUserSession();

        await expect(userSession.withdraw(ethers.constants.AddressZero))
          .to.be.revertedWith(revertWith);
      });

      it("end contract", async () => {
        const [, userSession] = await getUserSession();

        await expect(userSession.end(ethers.constants.AddressZero))
          .to.be.revertedWith(revertWith);
      });
    });
  });
});
