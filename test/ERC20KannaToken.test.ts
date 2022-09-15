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

  describe("Allowance", async () => {
    beforeEach(async () => {});

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

    // TODO: testar taxas
    // TODO: testar inclusão de contratos
    // TODO: revisar planilha do rapha
  });
});
