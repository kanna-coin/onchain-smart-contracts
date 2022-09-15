import { ethers } from "hardhat";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { ERC20KannaToken__factory, ERC20KannaToken } from "../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

chai.use(chaiAsPromised);
const { expect } = chai;

describe("KNN Token", () => {
  let erc20KannaToken: ERC20KannaToken;
  let signers: SignerWithAddress[];

  beforeEach(async () => {
    signers = await ethers.getSigners();

    const [deployerWallet] = signers;

    const erc20kannaTokenFactory = (await ethers.getContractFactory(
      "ERC20KannaToken",
      deployerWallet
    )) as ERC20KannaToken__factory;
    erc20KannaToken = await erc20kannaTokenFactory.deploy(
      deployerWallet.address
    );
    await erc20KannaToken.deployed();
  });

  describe("MaxSupply", async () => {
    it("should allow minting when bellow maximum supply (<=19MM)", async () => {
      const { blockNumber, blockHash } = await erc20KannaToken.mint("1");

      expect(blockNumber).to.greaterThan(1);
      expect(blockHash).to.contain("0x");
    });

    it("should prevent minting above maximum supply (>19MM)", async () => {
      const mintOverflow = await erc20KannaToken
        .mint("9000000000000000000000001")
        .catch((e) => e);

      expect(mintOverflow).to.be.an.instanceOf(Error);
    });
  });

  describe("Allowance", async () => {
    beforeEach(async () => {
      await erc20KannaToken.mint("10000000000000000000000");
    });

    it("should transfer KNN from account to another", async () => {
      const [deployerWallet, kannaWallet] = signers;
      const amount: string = "50000";

      await erc20KannaToken.approve(deployerWallet.address, amount);

      const result = await erc20KannaToken.transferFrom(
        deployerWallet.address,
        kannaWallet.address,
        amount
      );

      expect(result).to.not.null;
    });
  });
});
