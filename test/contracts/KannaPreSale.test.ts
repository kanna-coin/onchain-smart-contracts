import { ethers, network } from "hardhat";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { KannaTreasurer, KannaToken, KannaPreSale } from "../../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import getKnnToken from "../../src/infrastructure/factories/KannaTokenFactory";
import getKnnTreasurer from "../../src/infrastructure/factories/KannaTreasurerFactory";
import getKnnPreSale from "../../src/infrastructure/factories/KannaPreSaleFactory";

chai.use(chaiAsPromised);
const { expect } = chai;

describe("KNN PreSale", () => {
  let signers: SignerWithAddress[];
  let knnToken: KannaToken;
  let knnTreasurer: KannaTreasurer;
  let knnPreSale: KannaPreSale;

  const deployContracts = async () => {
    signers = await ethers.getSigners();

    const [deployerWallet] = signers;

    knnToken = await getKnnToken(deployerWallet);

    knnTreasurer = await getKnnTreasurer(deployerWallet, knnToken);

    knnPreSale = await getKnnPreSale(deployerWallet, knnToken, knnTreasurer);
  };

  describe("Setup", async () => {
    beforeEach(async () => {
      await deployContracts();
    });

    it("should initialize KNN PreSale with amount of 50K tokens", async () => {
      const tokensToSell = await knnToken.balanceOf(knnPreSale.address);
      const balance = parseInt(tokensToSell._hex, 16);

      expect(balance).to.greaterThanOrEqual(5e22);
    });

    it("should convert ETH to KNN", async () => {
      const [total, quotation] = await knnPreSale.convertToKNN(
        ethers.utils.parseEther("1")
      );

      expect(parseFloat(ethers.utils.formatEther(total))).to.greaterThan(2000);
      expect(parseInt(quotation.toHexString(), 16)).to.greaterThan(1000 * 1e8);
    });

    it("should buy KNN tokens", async () => {
      const [deployerWallet] = signers;

      await network.provider.send("hardhat_setBalance", [
        deployerWallet.address,
        "0xFFFFFFFFFFFFFFFF",
      ]);
      await network.provider.send("evm_mine");

      const options = { value: ethers.utils.parseEther("5.001001999238") };
      await knnPreSale.buyTokens(options);
      const tokensToSell = await knnToken.balanceOf(knnPreSale.address);
      const balance = parseInt(tokensToSell._hex, 16);

      expect(balance).to.lessThan(3.5e23);
    });

    it("should not buy KNN tokens when presale is unavailable", async () => {
      const [deployerWallet] = signers;

      await network.provider.send("hardhat_setBalance", [
        deployerWallet.address,
        "0xFFFFFFFFFFFFFFFF",
      ]);
      await network.provider.send("evm_mine");

      await knnPreSale.updateAvailablity(false);

      const options = { value: ethers.utils.parseEther("1") };

      const error = await knnPreSale
        .buyTokens(options)
        .then(() => null)
        .catch((e) => e);

      expect(error).to.not.null;
    });

    // it("should validate ETH amount", async () => {
    //   const options = { value: ethers.utils.parseEther("0.005") };
    //   const error = await knnPreSale
    //     .buyTokens(options)
    //     .then(() => null)
    //     .catch((e) => e);

    //   expect(error).to.eq({});
    // });

    // it("should start with 0 sold tokens", async () => {
    //   const soldHex = await knnPreSale.sold();
    //   const sold = parseInt(soldHex._hex, 16);

    //   expect(sold).to.eq(0);
    // });

    // it("should retrieve sold tokens", async () => {
    //   const [deployerWallet] = signers;

    //   await network.provider.send("hardhat_setBalance", [
    //     deployerWallet.address,
    //     "0xFFFFFFFFFFFFFFFF",
    //   ]);
    //   await network.provider.send("evm_mine");

    //   const options = { value: ethers.utils.parseEther("1.0") };
    //   await knnPreSale.buyTokens(options);
    //   const soldHex = await knnToken.balanceOf()
    //   const sold = parseInt(soldHex._hex, 16);

    //   expect(sold).to.eq(1e18);
    // });

    it("should update quotation", async () => {
      const currentPriceHex = await knnPreSale.price();
      await knnPreSale.updateQuotation(5 * 1e8);
      const newPriceHex = await knnPreSale.price();

      const currentPrice = parseInt(currentPriceHex._hex, 16);
      const newPrice = parseInt(newPriceHex._hex, 16);

      expect(currentPrice).to.lessThan(newPrice);
    });
  });
});
