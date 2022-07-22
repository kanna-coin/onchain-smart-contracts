import { ethers} from "hardhat";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { ERC20KannaToken__factory, ERC20KannaToken } from "../typechain";

chai.use(chaiAsPromised);
const { expect } = chai;

describe('ERC20KannaToken', () => {
  let erc20KannaToken: ERC20KannaToken;

  beforeEach(async () => {
    const signers = await ethers.getSigners();

    const erc20kannaTokenFactory = (await ethers.getContractFactory(
      "ERC20KannaToken",
      signers[0]
    )) as ERC20KannaToken__factory;
    erc20KannaToken = await erc20kannaTokenFactory.deploy();
    await erc20KannaToken.deployed();
  });

  describe('MaxSupply', async () => {
    it('should allow minting when bellow maximum supply (<=19MM)', async () => {
      const { blockNumber, blockHash } = await erc20KannaToken.mint('1');

      expect(blockNumber).to.greaterThan(1);
      expect(blockHash).to.contain('0x');
    })

    it('should prevent minting above maximum supply (>19MM)', async () => {
      const mintOverflow = await erc20KannaToken.mint('9000000000000000000000001')
        .catch(e => e);

      expect(mintOverflow).to.be.an.instanceOf(Error);
    })
  });
});
