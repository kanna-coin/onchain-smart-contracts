import { ethers } from "hardhat";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { ERC20KannaToken__factory, ERC20KannaToken } from "../../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

chai.use(chaiAsPromised);
const { expect } = chai;
const parseKNN = (bigNumberish: any): number => {
  const parts = ethers.utils.formatEther(bigNumberish).split(".");
  return parseFloat(
    `${parseFloat(parts[0])}.${parseFloat(parts[1]).toFixed(2)}`
  );
};

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
      const [deployerWallet, kannaWallet, randomWallet, randomWallet2] =
        signers;
      const amount: string = "50000000000000000000";

      await erc20KannaToken.approve(deployerWallet.address, amount);

      const result = await erc20KannaToken.transferFrom(
        deployerWallet.address,
        randomWallet.address,
        amount
      );

      const scopedToken = await ethers.getContractAt(
        "ERC20KannaToken",
        erc20KannaToken.address,
        randomWallet
      );

      await scopedToken.transfer(randomWallet2.address, amount);

      const balance = await scopedToken.balanceOf(randomWallet2.address);
      console.log(parseKNN(balance));
      expect(parseKNN(balance)).to.eq(50 * 0.99);
    });

    // TODO: testar taxas
    // TODO: testar inclusão de contratos
    // TODO: revisar planilha do rapha
  });
});
