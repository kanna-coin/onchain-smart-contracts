import { ethers } from "hardhat";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { KannaToken } from "../../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { getKnnToken } from "../../src/infrastructure/factories";

chai.use(chaiAsPromised);
const { expect } = chai;

describe("KNN Token", () => {
  let knnToken: KannaToken;
  let signers: SignerWithAddress[];

  const deployContracts = async () => {
    signers = await ethers.getSigners();

    const [deployerAddress] = signers;

    knnToken = await getKnnToken(deployerAddress);
  };

  const getDeployerWallet = async () => {
    const [deployerWallet] = signers;

    return deployerWallet;
  };

  const getUserSession = async (): Promise<[KannaToken, SignerWithAddress]> => {
    const [, , userWallet] = signers;

    const userSession = await ethers.getContractAt(
      "KannaToken",
      knnToken.address,
      userWallet
    ) as KannaToken;

    return [userSession, userWallet];
  };

  const getUser2Session = async (): Promise<[KannaToken, SignerWithAddress]> => {
    const [, , , userWallet] = signers;

    const userSession = await ethers.getContractAt(
      "KannaToken",
      knnToken.address,
      userWallet
    ) as KannaToken;

    return [userSession, userWallet];
  };

  const getTreasuryWallet = async (): Promise<SignerWithAddress> => {
    const [, , , treasuryWallet] = signers;

    return treasuryWallet;
  };

  const initializeTreasury = async (kannaToken: KannaToken) => {
    const treasuryWallet = await getTreasuryWallet();

    await kannaToken.initializeTreasury(treasuryWallet.address);

    return await kannaToken.connect(treasuryWallet);
  };

  const getMinterSession = async (): Promise<[KannaToken, SignerWithAddress]> => {
    const [, minterWallet] = signers;

    await knnToken.addMinter(minterWallet.address);

    const minterSession = await ethers.getContractAt(
      "KannaToken",
      knnToken.address,
      minterWallet
    ) as KannaToken;

    return [minterSession, minterWallet];
  };

  describe("Treasury", async () => {
    beforeEach(async () => {
      await deployContracts();
    });

    it("should initialize and mint initial supply amount to treasury (KannaTreasurer UC)", async () => {
      const deployerWallet = await getDeployerWallet();

      const knnTreasurer = await getTreasuryWallet();

      const oldTreasury = await knnToken.treasury();

      const initialSupply = await knnToken.INITIAL_SUPPLY;

      await expect(knnToken.initializeTreasury(knnTreasurer.address))
        .to.emit(knnToken, 'TreasuryUpdate').withArgs(
          deployerWallet.address,
          oldTreasury,
          knnTreasurer.address
        )
        .to.emit(knnToken, "Transfer").withArgs(
          ethers.constants.AddressZero,
          knnTreasurer.address,
          initialSupply,
        );
    });

    it("should update treasury", async () => {
      const deployerWallet = await getDeployerWallet();
      const [, userWallet] = await getUserSession();
      const treasuryWallet = await getTreasuryWallet();

      await initializeTreasury(knnToken);

      await expect(knnToken.updateTreasury(userWallet.address))
        .to.emit(knnToken, 'TreasuryUpdate').withArgs(
          deployerWallet.address,
          treasuryWallet.address,
          userWallet.address
        )
    });

    it("should NOT allow invalid address on initialize", async () => {
      await expect(knnToken.initializeTreasury(ethers.constants.AddressZero))
        .to.be.revertedWith("Invalid treasury address");
    });

    it("should NOT allow invalid address on update", async () => {
      await expect(knnToken.updateTreasury(ethers.constants.AddressZero))
        .to.be.revertedWith("Invalid treasury address");
    });

    it("should NOT allow initialization more than once", async () => {
      const deployerWallet = await getDeployerWallet();

      await knnToken.initializeTreasury(deployerWallet.address);

      await expect(knnToken.initializeTreasury(deployerWallet.address)).to.rejectedWith("Treasury already initialized");
    });
  });

  describe("Transfer", async () => {
    beforeEach(async () => {
      await deployContracts();
    });

    it("should allow use of unified Minter and Treasury (Multisig/GnosisSafe UC)", async () => {
      const deployerWallet = await getDeployerWallet();
      const [minterSession] = await getMinterSession();
      const [userSession, userWallet] = await getUserSession();
      const [, user2Wallet] = await getUser2Session();

      const amount = ethers.utils.parseEther("2000.0");

      await knnToken.initializeTreasury(deployerWallet.address);

      await minterSession.mint(amount);
      await knnToken.transfer(userWallet.address, amount);

      await userSession.transfer(user2Wallet.address, amount);

      const wallet2Balance = await knnToken.balanceOf(user2Wallet.address);

      expect(wallet2Balance).to.eq(amount);
    });
  });

  describe("Mint", async () => {
    beforeEach(async () => {
      await deployContracts();
    });

    it("should mint directly to a defined treasury account (compliant GnosisSafe<>KannaTreasurer UC)", async () => {
      const [minterSession] = await getMinterSession();
      const treasuryWallet = await getTreasuryWallet();

      await initializeTreasury(knnToken);

      const treasuryBalanceBefore = await knnToken.balanceOf(
        treasuryWallet.address
      );

      const balance1 = parseInt(treasuryBalanceBefore._hex, 16);

      expect(balance1).to.eq(1e25);

      // 0.5MM
      await minterSession.mint(ethers.utils.parseEther("500000.0"));

      const treasuryBalanceHexAfter = await knnToken.balanceOf(
        treasuryWallet.address
      );

      const balance2 = parseInt(treasuryBalanceHexAfter._hex, 16);

      // 10.5MM
      expect(balance2).to.eq(1.05e25);
    });

    it("should limit max supply to 19MM Tokens", async () => {
      const [minterSession] = await getMinterSession();
      const treasuryWallet = await getTreasuryWallet();

      await initializeTreasury(knnToken);

      const treasuryBalanceHexBefore = await knnToken.balanceOf(
        treasuryWallet.address
      );

      const balance1 = parseInt(treasuryBalanceHexBefore._hex, 16);

      expect(balance1).to.eq(1e25);

      await expect(minterSession.mint(ethers.utils.parseEther("10500000.0")))
        .to.be.revertedWith("Maximum Supply reached");
    });

    it("should prevent minting when MINTER_ROLE not present", async () => {
      const [minterSession, minterWallet] = await getMinterSession();

      await knnToken.removeMinter(minterWallet.address);

      await expect(minterSession.mint(ethers.utils.parseEther("1.0")))
        .to.be.reverted;
    });

    it("should prevent minting when not a MINTER", async () => {
      await expect(knnToken.mint(ethers.utils.parseEther("1.0")))
        .to.be.reverted;
    });

    it("should prevent minting without treasury", async () => {
      const [minterSession] = await getMinterSession();

      await expect(minterSession.mint(ethers.utils.parseEther("1.0")))
        .to.be.revertedWith("ERC20: mint to the zero address");
    });

    it("should prevent minting empty amount", async () => {
      const [minterSession] = await getMinterSession();

      await initializeTreasury(knnToken);

      await expect(minterSession.mint(0))
        .to.be.revertedWith("Invalid Amount");
    });
  });
});
