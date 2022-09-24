import { ethers } from "hardhat";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import {
  KannaTreasurer__factory,
  KannaTreasurer,
  ERC20KannaToken__factory,
  ERC20KannaToken,
} from "../../typechain";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import getKnnToken from "../../src/infrastructure/factories/KannaTokenFactory";

chai.use(chaiAsPromised);
const { expect } = chai;

const parse1e18 = (integer: number): string => `${integer}000000000000000000`;

const parseKNN = (bigNumberish: any): number => {
  const parts = ethers.utils.formatEther(bigNumberish).split(".");
  return parseFloat(
    `${parseFloat(parts[0])}.${parseFloat(parts[1]).toFixed(2)}`
  );
};

let erc20KannaToken: ERC20KannaToken;
let signers: SignerWithAddress[];

const deployContracts = async () => {
  signers = await ethers.getSigners();

  const [deployerAddress] = signers;

  erc20KannaToken = await getKnnToken(deployerAddress);
};

describe("KNN Token", () => {
  describe(".initializeTreasury", async () => {
    beforeEach(async () => {
      await deployContracts();
    });
  });

  describe(".updateTransactionFee", async () => {
    beforeEach(async () => {
      await deployContracts();
    });
  });

  describe(".transferFrom", async () => {
    beforeEach(async () => {
      await deployContracts();
    });
  });

  describe(".transfer", async () => {
    beforeEach(async () => {
      await deployContracts();
    });
  });

  describe(".mint", async () => {
    beforeEach(async () => {
      await deployContracts();
    });
  });

  describe(".noTransferFee", async () => {
    beforeEach(async () => {
      await deployContracts();
    });
  });

  describe(".addMinter", async () => {
    beforeEach(async () => {
      await deployContracts();
    });
  });
});
