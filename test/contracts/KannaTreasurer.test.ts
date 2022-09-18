import { ethers } from "hardhat";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import {
  KannaTreasurer__factory,
  KannaTreasurer,
  ERC20KannaToken,
  ERC20KannaToken__factory,
} from "../../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

chai.use(chaiAsPromised);
const { expect } = chai;

describe.skip("KNN Treasurer", () => {
  let treasurer: KannaTreasurer;
  let signers: SignerWithAddress[];
  let token: ERC20KannaToken;

  const deployContracts = async () => {
    signers = await ethers.getSigners();

    const [deployerWallet] = signers;

    const tokenFactory = (await ethers.getContractFactory(
      "ERC20KannaToken",
      deployerWallet
    )) as ERC20KannaToken__factory;

    token = await tokenFactory.deploy(deployerWallet.address);
    await token.deployed();

    const treasurerFactory = (await ethers.getContractFactory(
      "KannaTreasurer",
      deployerWallet
    )) as KannaTreasurer__factory;

    treasurer = await treasurerFactory.deploy(token.address);

    await treasurer.deployed();
  };

  describe("Setup", async () => {
    it("should initialize KNN Treasurer after KNN Token", async () => {
      const res = await deployContracts().then(() => true);

      expect(res).to.true;
    });
  });

  describe("Ownership", async () => {
    it("should be owned by KNN Deployer", async () => {
      await deployContracts();
      const [deployerWallet] = signers;

      const treasurerOwner = await treasurer.owner();

      expect(deployerWallet.address).to.eq(treasurerOwner);
    });

    it("should transfer KNN Token ownership from KNN Deployer to KNN Treasurer", async () => {
      await deployContracts();
      const [deployerWallet] = signers;
      await token.transferOwnership(treasurer.address);

      const tokenOwner = await token.owner();

      expect(treasurer.address).to.eq(tokenOwner);
    });
  });

  describe("Yield Payer", async () => {
    it("should add a Yield Payer address with 400K Tokens", async () => {
      const [yieldPayerWallet] = await ethers.getSigners();

      await deployContracts();
      await token.transferOwnership(treasurer.address);

      const yieldContractAmount = "400000000000000000000000";

      const treasurerFactory = (await ethers.getContractFactory(
        "KannaTreasurer",
        yieldPayerWallet
      )) as KannaTreasurer__factory;

      const yieldPayerMock = await treasurerFactory.deploy(token.address);

      await yieldPayerMock.deployed();

      await token.approve(treasurer.address, yieldContractAmount);

      await treasurer.addYieldContract(
        yieldPayerMock.address,
        yieldContractAmount
      );

      const yieldPayerBalance = await token.balanceOf(yieldPayerMock.address);
      const treasurerBalance = await token.balanceOf(treasurer.address);
      const tokenBalance = await token.balanceOf(token.address);
      const deployerBalance = await token.balanceOf(await treasurer.owner());

      const balances = {
        yield: parseInt(yieldPayerBalance._hex, 16),
        treasurer: parseInt(treasurerBalance._hex, 16),
        token: parseInt(tokenBalance._hex, 16),
        deployer: parseInt(deployerBalance._hex, 16),
      };

      expect(balances.yield).to.eq(parseInt(yieldContractAmount));
    });
  });
});
