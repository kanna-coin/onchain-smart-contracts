import { ethers } from 'hardhat';
import { KannaStockOption__factory, KannaToken } from '../../typechain-types';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { getKnnToken } from '../../src/infrastructure/factories';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

chai.use(chaiAsPromised);
const { expect } = chai;

const contractName = 'KannaStockOption';

const DAY_UNIT = 86400000;
const zeros = '0'.repeat(18);
const parse1e18 = (integer: number): string => `${integer}${zeros}`;

const statusEnum = {
  Cliff: 0,
  Lock: 1,
  Vesting: 2,
};

describe('KNN Stock Option', () => {
  let token: KannaToken;

  let deployer: SignerWithAddress;
  let holder: SignerWithAddress;
  let treasuryWallet: SignerWithAddress;

  let sopFactory: KannaStockOption__factory;

  beforeEach(async () => {
    [, holder, deployer, treasuryWallet] = await ethers.getSigners();
    token = await getKnnToken(deployer, treasuryWallet);
    sopFactory = (await ethers.getContractFactory(
      contractName,
      treasuryWallet
    )) as KannaStockOption__factory;
  });

  it('should cancel by owner while in the cliff duration', async () => {
    const blockTimestamp = (await ethers.provider.getBlock('latest')).timestamp;

    const daysOfCliff = 90;
    const daysOfVesting = 365;
    const daysOfLock = 60;
    const startDate = new Date(blockTimestamp * 1000);

    const contract = await initialize(
      sopFactory,
      treasuryWallet,
      token,
      startDate,
      daysOfVesting,
      daysOfCliff,
      daysOfLock,
      holder,
      100,
      20
    );

    await contract.connect(treasuryWallet).finalize();

    const totalVested = await contract.totalVested();

    const status = await contract.status();

    expect(status).to.equal(statusEnum.Cliff);
    expect(Number(totalVested.toString())).to.equal(0);
  });

  it('should cancel by holder while in the cliff duration', async () => {
    const blockTimestamp = (await ethers.provider.getBlock('latest')).timestamp;

    const daysOfCliff = 90;
    const daysOfVesting = 365;
    const daysOfLock = 60;
    const startDate = new Date(blockTimestamp * 1000);

    const contract = await initialize(
      sopFactory,
      treasuryWallet,
      token,
      startDate,
      daysOfVesting,
      daysOfCliff,
      daysOfLock,
      holder,
      100,
      20
    );

    await contract.connect(holder).finalize();
    const status = await contract.status();

    expect(status).to.equal(statusEnum.Cliff);

    const totalVested = await contract.totalVested();

    expect(Number(totalVested.toString())).to.equal(0);
  });

  it('should cancel after the cliff duration (as owner)', async () => {
    const daysOfCliff = 90;
    const daysOfVesting = 365;
    const daysOfLock = 60;

    const blockTimestamp = (await ethers.provider.getBlock('latest')).timestamp;
    const startDate = new Date((blockTimestamp * 1000) - DAY_UNIT * (daysOfCliff + 1));

    const contract = await initialize(
      sopFactory,
      treasuryWallet,
      token,
      startDate,
      daysOfVesting,
      daysOfCliff,
      daysOfLock,
      holder,
      10000,
      20
    );

    await contract.connect(treasuryWallet).finalize();

    const totalVested = await contract.totalVested();

    const status = await contract.status();

    expect(status).to.equal(statusEnum.Lock);

    expect(Number(totalVested.toString())).not.to.equal(0);
  });

  it('should cancel after the cliff duration (as holder)', async () => {
    const daysOfCliff = 90;
    const daysOfVesting = 365;
    const daysOfLock = 60;

    const blockTimestamp = (await ethers.provider.getBlock('latest')).timestamp;
    const startDate = new Date((blockTimestamp * 1000) - DAY_UNIT * (daysOfCliff + 1));

    const contract = await initialize(
      sopFactory,
      treasuryWallet,
      token,
      startDate,
      daysOfVesting,
      daysOfCliff,
      daysOfLock,
      holder,
      10000,
      20
    );

    await contract.connect(holder).finalize();

    const totalVested = await contract.totalVested();

    const status = await contract.status();

    expect(status).to.equal(statusEnum.Lock);

    expect(Number(totalVested.toString())).not.to.equal(0);
  });

  it('should not withdraw before cliff duration', async () => {
    const blockTimestamp = (await ethers.provider.getBlock('latest')).timestamp;

    const daysOfCliff = 90;
    const daysOfVesting = 365;
    const daysOfLock = 60;
    const startDate = new Date(blockTimestamp * 1000);

    const contract = await initialize(
      sopFactory,
      treasuryWallet,
      token,
      startDate,
      daysOfVesting,
      daysOfCliff,
      daysOfLock,
      holder,
      100,
      20
    );

    const totalVested = await contract.totalVested();

    const status = await contract.status();

    expect(status).to.equal(statusEnum.Cliff);

    expect(Number(totalVested.toString())).to.equal(0);

    expect(contract.connect(holder).withdraw(1)).to.be.reverted;
  });

  it('should not withdraw an amoount above Grant before lock duration', async () => {
    const daysOfCliff = 300;
    const daysOfVesting = 365;
    const daysOfLock = 60;

    const blockTimestamp = (await ethers.provider.getBlock('latest')).timestamp;
    const startDate = new Date((blockTimestamp * 1000) - DAY_UNIT * (daysOfCliff + 1));

    const contract = await initialize(
      sopFactory,
      treasuryWallet,
      token,
      startDate,
      daysOfVesting,
      daysOfCliff,
      daysOfLock,
      holder,
      100,
      20
    );

    const status = await contract.status();

    expect(status).to.equal(statusEnum.Lock);

    const withdrawTx = contract.connect(holder).withdraw(parse1e18(21));

    await expect(withdrawTx).to.be.revertedWith(
      'KannaStockOption: amountToWithdraw is greater than availableToWithdraw'
    );
  });

  it('should withdraw Grant amount within lock duration', async () => {
    const daysOfCliff = 300;
    const daysOfVesting = 365;
    const daysOfLock = 60;

    const blockTimestamp = (await ethers.provider.getBlock('latest')).timestamp;
    const startDate = new Date((blockTimestamp * 1000) - DAY_UNIT * (daysOfCliff + 1));

    const contract = await initialize(
      sopFactory,
      treasuryWallet,
      token,
      startDate,
      daysOfVesting,
      daysOfCliff,
      daysOfLock,
      holder,
      100,
      20
    );

    const status = await contract.status();

    expect(status).to.equal(statusEnum.Lock);

    const withdrawTx = contract.connect(holder).withdraw(parse1e18(20));

    await expect(withdrawTx).not.to.be.revertedWith(
      'KannaStockOption: amountToWithdraw is greater than availableToWithdraw'
    );
  });

  it('should not allow contract to be withdrawn by non-holder', async () => {
    const daysOfCliff = 300;
    const daysOfVesting = 365;
    const daysOfLock = 60;

    const blockTimestamp = (await ethers.provider.getBlock('latest')).timestamp;
    const startDate = new Date((blockTimestamp * 1000) - DAY_UNIT * (daysOfCliff + 1));

    const contract = await initialize(
      sopFactory,
      treasuryWallet,
      token,
      startDate,
      daysOfVesting,
      daysOfCliff,
      daysOfLock,
      holder,
      100,
      20
    );

    const status = await contract.status();

    expect(status).to.equal(statusEnum.Lock);

    const withdrawTx = contract.connect(treasuryWallet).withdraw(parse1e18(20));

    await expect(withdrawTx).to.be.revertedWith(
      'KannaStockOption: caller is not the beneficiary'
    );
  });

  it('should withdraw after canceled', async () => {
    const daysOfCliff = 300;
    const daysOfVesting = 365;
    const daysOfLock = 60;

    const blockTimestamp = (await ethers.provider.getBlock('latest')).timestamp;
    const startDate = new Date((blockTimestamp * 1000) - DAY_UNIT * (daysOfCliff + 1));

    const contract = await initialize(
      sopFactory,
      treasuryWallet,
      token,
      startDate,
      daysOfVesting,
      daysOfCliff,
      daysOfLock,
      holder,
      100,
      20
    );

    const status = await contract.status();

    expect(status).to.equal(statusEnum.Lock);

    await contract.connect(treasuryWallet).finalize();

    const holderBalance = await token.balanceOf(holder.address);

    expect(Number(holderBalance.toString()) / 1e18).to.equal(20);

    const withdrawTx = contract.connect(holder).withdraw(parse1e18(1));

    await expect(withdrawTx).not.to.be.revertedWith(
      'KannaStockOption: contract already finalized'
    );
  });

  it('should retrieve a vesting forecast', async () => {
    const blockTimestamp = (await ethers.provider.getBlock('latest')).timestamp;

    const daysOfCliff = 90;
    const daysOfVesting = 365;
    const daysOfLock = 60;
    const startDate = new Date(blockTimestamp * 1000);

    const forecastDate = new Date(
      startDate.getTime() + DAY_UNIT * (daysOfCliff + 1)
    );

    const totalAmount = 100;

    const contract = await initialize(
      sopFactory,
      treasuryWallet,
      token,
      startDate,
      daysOfVesting,
      daysOfCliff,
      daysOfLock,
      holder,
      totalAmount,
      20
    );

    await contract.connect(treasuryWallet).finalize();

    const vestedAmount = await contract.totalVested();

    const forecastAmount = await contract.vestingForecast(
      Math.floor(forecastDate.getTime() / 1000)
    );

    const maxGrantAmount = await contract.maxGrantAmount();

    expect(Number(maxGrantAmount.toString())).to.equal(Number(parse1e18(20)));
    expect(Number(vestedAmount.toString())).to.equal(0);
    expect(Number(forecastAmount.toString()) / 1e18).to.lte(
      Number(parse1e18(totalAmount))
    );
  });

  it('should withdraw after lock', async () => {
    const daysOfCliff = 300;
    const daysOfVesting = 365;
    const daysOfLock = 60;

    const blockTimestamp = (await ethers.provider.getBlock('latest')).timestamp;
    const startDate = new Date((blockTimestamp * 1000) - DAY_UNIT * (daysOfVesting + 1));

    const contract = await initialize(
      sopFactory,
      treasuryWallet,
      token,
      startDate,
      daysOfVesting,
      daysOfCliff,
      daysOfLock,
      holder,
      100,
      20
    );

    const status = await contract.status();

    expect(status).to.equal(statusEnum.Vesting);

    await contract.connect(holder).withdraw(parse1e18(100));

    const holderBalance = await token.balanceOf(holder.address);
    const contractBalance = await token.balanceOf(contract.address);

    expect(Number(holderBalance.toString()) / 1e18).to.equal(100);
    expect(Number(contractBalance.toString()) / 1e18).to.equal(0);
  });

  it('should cancel at any time', async () => {
    const daysOfCliff = 300;
    const daysOfVesting = 365;
    const daysOfLock = 60;

    const blockTimestamp = (await ethers.provider.getBlock('latest')).timestamp;
    const startDate = new Date((blockTimestamp * 1000) - DAY_UNIT * (daysOfVesting - 1));

    const contract = await initialize(
      sopFactory,
      treasuryWallet,
      token,
      startDate,
      daysOfVesting,
      daysOfCliff,
      daysOfLock,
      holder,
      100,
      20
    );

    const status = await contract.status();

    expect(status).to.equal(statusEnum.Lock);

    await contract.connect(holder).abort();

    const contractBalance = await token.balanceOf(contract.address);

    expect(Number(contractBalance.toString()) / 1e18).to.equal(0);
  });

  it('should set owner on initialize', async () => {
    const blockTimestamp = (await ethers.provider.getBlock('latest')).timestamp;

    const daysOfCliff = 90;
    const daysOfVesting = 365;
    const daysOfLock = 60;
    const startDate = new Date(blockTimestamp * 1000);
    const integerAmount = 100;

    const contract = await sopFactory.deploy();
    await contract.deployed();

    await contract.renounceOwnership();

    const amount = parse1e18(integerAmount);

    await token.connect(treasuryWallet).increaseAllowance(contract.address, amount);

    const tx = contract.connect(treasuryWallet).initialize(
      token.address,
      Math.floor(startDate.getTime() / 1000),
      daysOfVesting,
      daysOfCliff,
      daysOfLock,
      10,
      amount,
      holder.address
    );

    await expect(tx)
      .to.emit(contract, 'OwnershipTransferred')
      .withArgs(
        ethers.constants.AddressZero,
        treasuryWallet.address,
      );
  });
});

async function initialize(
  stockFactory: KannaStockOption__factory,
  owner: SignerWithAddress,
  token: KannaToken,
  startDate: Date,
  daysOfVesting: number,
  daysOfCliff: number,
  daysOfLock: number,
  beneficiary: SignerWithAddress,
  integerAmount: number,
  percentOfGrant: number
) {
  const contract = await stockFactory.deploy();

  await contract.deployed();

  const amount = parse1e18(integerAmount);

  await token.connect(owner).increaseAllowance(contract.address, amount);

  await contract
    .connect(owner)
    .initialize(
      token.address,
      Math.floor(startDate.getTime() / 1000),
      daysOfVesting,
      daysOfCliff,
      daysOfLock,
      percentOfGrant,
      amount,
      beneficiary.address
    );

  return contract;
}
