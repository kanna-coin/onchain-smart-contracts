import { ethers, network } from 'hardhat';
import {
  KannaStockOption,
  KannaStockOption__factory,
  KannaToken,
} from '../../typechain-types';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import {
  getKnnToken,
  releaseFromTreasury,
} from '../../src/infrastructure/factories';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

chai.use(chaiAsPromised);
const { expect } = chai;

const contractName = 'KannaStockOption';

const DAY_UNIT = 86400;
const zeros = '0'.repeat(18);
const parse1e18 = (integer: number): string => `${integer}${zeros}`;

describe('KNN Stock Option', () => {
  let token: KannaToken;

  let deployer: SignerWithAddress;
  let owner: SignerWithAddress;
  let holder: SignerWithAddress;
  let treasuryWallet: SignerWithAddress;

  let stockFactory: KannaStockOption__factory;

  beforeEach(async () => {
    [owner, holder, deployer, treasuryWallet] = await ethers.getSigners();
    token = await getKnnToken(deployer, treasuryWallet);
    stockFactory = (await ethers.getContractFactory(
      contractName,
      owner
    )) as KannaStockOption__factory;
  });

  it('should cancel while in the cliff duration', async () => {
    const cliff = DAY_UNIT * 90;
    const lock = DAY_UNIT * 365;

    const contract = await stockFactory.deploy(
      owner.address,
      holder.address,
      cliff,
      lock,
      token.address
    );

    await contract.deployed();

    const amount = parse1e18(100);

    await token.connect(treasuryWallet).transfer(contract.address, amount);

    const tx = await contract.cancel();
    const { status } = await tx.wait();

    expect(Boolean(status)).to.be.true;
  });

  it('should not cancel after cliff duration', async () => {
    const cliff = DAY_UNIT * 90;
    const lock = DAY_UNIT * 365;

    const contract = await stockFactory.deploy(
      owner.address,
      holder.address,
      cliff,
      lock,
      token.address
    );

    await contract.deployed();

    const amount = parse1e18(100);

    await token.connect(treasuryWallet).transfer(contract.address, amount);

    await network.provider.send('evm_increaseTime', [cliff + 1]);
    await network.provider.send('evm_mine');

    expect(contract.cancel()).to.be.revertedWith('Cannot cancel after cliff');
  });

  it('should not withdraw before cliff duration', async () => {
    const cliff = DAY_UNIT * 90;
    const lock = DAY_UNIT * 365;

    const contract = await stockFactory.deploy(
      owner.address,
      holder.address,
      cliff,
      lock,
      token.address
    );

    await contract.deployed();

    const amount = parse1e18(100);

    await token.connect(treasuryWallet).transfer(contract.address, amount);

    await network.provider.send('evm_increaseTime', [1]);
    await network.provider.send('evm_mine');

    expect(contract.connect(holder).withdraw()).to.be.revertedWith(
      'Cannot withdraw while in cliff'
    );
  });

  it('should not withdraw before lock duration', async () => {
    const cliff = DAY_UNIT * 90;
    const lock = DAY_UNIT * 365;

    const contract = await stockFactory.deploy(
      owner.address,
      holder.address,
      cliff,
      lock,
      token.address
    );

    await contract.deployed();

    const amount = parse1e18(100);

    await token.connect(treasuryWallet).transfer(contract.address, amount);

    await network.provider.send('evm_increaseTime', [cliff + 1]);
    await network.provider.send('evm_mine');

    expect(contract.connect(holder).withdraw()).to.be.revertedWith(
      'Cannot withdraw before lock duration'
    );
  });

  it('should allow contract to be withdrawn after the lock duration', async () => {
    const cliff = DAY_UNIT * 90;
    const lock = DAY_UNIT * 365;

    const contract = await stockFactory.deploy(
      owner.address,
      holder.address,
      cliff,
      lock,
      token.address
    );

    await contract.deployed();

    const amount = parse1e18(100);

    await token.connect(treasuryWallet).transfer(contract.address, amount);

    await network.provider.send('evm_increaseTime', [cliff + lock + 1]);
    await network.provider.send('evm_mine');

    const tx = await contract.connect(holder).withdraw();
    const { status } = await tx.wait();

    expect(Boolean(status)).to.be.true;
  });

  it('should not allow contract to be withdrawn twice', async () => {
    const cliff = DAY_UNIT * 90;
    const lock = DAY_UNIT * 365;

    const contract = await stockFactory.deploy(
      owner.address,
      holder.address,
      cliff,
      lock,
      token.address
    );

    await contract.deployed();

    const amount = parse1e18(100);

    await token.connect(treasuryWallet).transfer(contract.address, amount);

    await network.provider.send('evm_increaseTime', [cliff + lock + 1]);
    await network.provider.send('evm_mine');

    await contract.connect(holder).withdraw();

    expect(contract.connect(holder).withdraw()).to.be.revertedWith(
      'Already withdrawn'
    );
  });

  it('should not allow contract to be withdrawn by non-holder', async () => {
    const cliff = DAY_UNIT * 90;
    const lock = DAY_UNIT * 365;

    const contract = await stockFactory.deploy(
      owner.address,
      holder.address,
      cliff,
      lock,
      token.address
    );

    await contract.deployed();

    await network.provider.send('evm_increaseTime', [cliff + lock + 1]);
    await network.provider.send('evm_mine');

    expect(contract.connect(owner).withdraw()).to.be.revertedWith(
      'Only holder can call this function'
    );
  });

  it('should not allow cancel twice', async () => {
    const cliff = DAY_UNIT * 90;
    const lock = DAY_UNIT * 365;

    const contract = await stockFactory.deploy(
      owner.address,
      holder.address,
      cliff,
      lock,
      token.address
    );

    await contract.deployed();

    const amount = parse1e18(100);

    await token.connect(treasuryWallet).transfer(contract.address, amount);

    await contract.cancel();

    expect(contract.cancel()).to.be.revertedWith('Contract already canceled');
  });

  it('should not withdraw after canceled', async () => {
    const cliff = DAY_UNIT * 90;
    const lock = DAY_UNIT * 365;

    const contract = await stockFactory.deploy(
      owner.address,
      holder.address,
      cliff,
      lock,
      token.address
    );

    await contract.deployed();

    const amount = parse1e18(100);

    await token.connect(treasuryWallet).transfer(contract.address, amount);

    await contract.cancel();

    await network.provider.send('evm_increaseTime', [cliff + lock + 1]);
    await network.provider.send('evm_mine');

    expect(contract.connect(owner).withdraw()).to.be.revertedWith(
      'Contract already canceled'
    );
  });

  it('should retrieve the amount vested', async () => {
    const cliff = DAY_UNIT * 90;
    const lock = DAY_UNIT * 365;

    const amount = parse1e18(100);

    const contract = await stockFactory.deploy(
      owner.address,
      holder.address,
      cliff,
      lock,
      token.address
    );

    await contract.deployed();
    await network.provider.send('evm_mine');

    await token.connect(treasuryWallet).transfer(contract.address, amount);
    await network.provider.send('evm_mine');

    await network.provider.send('evm_increaseTime', [cliff + lock + 1]);
    await network.provider.send('evm_mine');

    const vested = await contract.amountVested();

    expect(vested).to.equal(amount);
  });

  it('should retrieve the amount vested after cliff (1/4 duration)', async () => {
    const cliff = DAY_UNIT * 90;
    const lock = DAY_UNIT * 365;

    const amount = parse1e18(100);

    const contract = await stockFactory.deploy(
      owner.address,
      holder.address,
      cliff,
      lock,
      token.address
    );

    await contract.deployed();
    await network.provider.send('evm_mine');

    await token.connect(treasuryWallet).transfer(contract.address, amount);
    await network.provider.send('evm_mine');

    await network.provider.send('evm_increaseTime', [(cliff + lock) / 4]);
    await network.provider.send('evm_mine');

    const vested = await contract.amountVested();

    expect(Number(vested) / 1e18).to.greaterThanOrEqual(
      Number(amount) / 1e18 / 4
    );
  });

  it('should retrieve amount of days left to cancel', async () => {
    const cliff = DAY_UNIT * 90;
    const lock = DAY_UNIT * 365;

    const amount = parse1e18(100);

    const contract = await stockFactory.deploy(
      owner.address,
      holder.address,
      cliff,
      lock,
      token.address
    );

    await contract.deployed();
    await network.provider.send('evm_mine');

    await token.connect(treasuryWallet).transfer(contract.address, amount);
    await network.provider.send('evm_mine');

    let daysLeft = await contract.daysLeftToCancel();

    expect(daysLeft).to.equal(cliff / DAY_UNIT - 1);

    await network.provider.send('evm_increaseTime', [cliff + 1]);
    await network.provider.send('evm_mine');

    daysLeft = await contract.daysLeftToCancel();

    expect(daysLeft).to.equal(0);
  });

  it('should retrieve the amount of days left to withdraw', async () => {
    const cliff = DAY_UNIT * 90;
    const lock = DAY_UNIT * 365;

    const amount = parse1e18(100);

    const contract = await stockFactory.deploy(
      owner.address,
      holder.address,
      cliff,
      lock,
      token.address
    );

    await contract.deployed();
    await network.provider.send('evm_mine');

    await token.connect(treasuryWallet).transfer(contract.address, amount);
    await network.provider.send('evm_mine');

    await network.provider.send('evm_increaseTime', [cliff]);
    await network.provider.send('evm_mine');

    let daysLeft = await contract.daysLeftToWithdraw();

    expect(daysLeft).to.equal(lock / DAY_UNIT - 1);

    await network.provider.send('evm_increaseTime', [lock + 1]);
    await network.provider.send('evm_mine');

    daysLeft = await contract.daysLeftToWithdraw();

    expect(daysLeft).to.equal(0);
  });
});
