import { ethers, network } from 'hardhat';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { getKnnToken, getKannaStockOptionMock } from '../../src/infrastructure/factories';
import {
  KannaStockOptionManager__factory,
  KannaStockOption__factory,
  KannaToken,
  KannaStockOption,
  KannaStockOptionManager
} from '../../typechain-types';
import { ContractTransaction } from 'ethers';
import { ContractRegisteredEvent } from '../../typechain-types/contracts/KannaStockOptionManager';

chai.use(chaiAsPromised);
const { expect } = chai;

const zeros = '0'.repeat(18);
const parse1e18 = (integer: number): string => `${integer}${zeros}`;

describe('KNN Stock Option Manager', () => {
  let token: KannaToken;
  let baseStockOption: KannaStockOption;
  let stockOptionManager: KannaStockOptionManager;

  let deployer: SignerWithAddress;
  let holder: SignerWithAddress;
  let treasuryWallet: SignerWithAddress;

  let stockOptionMangerFactory: KannaStockOptionManager__factory;
  let stockOptionFactory: KannaStockOption__factory;

  const deployContracts = async () => {
    [, holder, deployer, treasuryWallet] = await ethers.getSigners();

    stockOptionMangerFactory = (await ethers.getContractFactory(
      'KannaStockOptionManager',
      treasuryWallet
    )) as KannaStockOptionManager__factory;

    stockOptionFactory = (await ethers.getContractFactory(
      'KannaStockOption',
      treasuryWallet
    )) as KannaStockOption__factory;

    token = await getKnnToken(deployer, treasuryWallet);

    stockOptionManager = await stockOptionMangerFactory.deploy();
  };

  const getUserSession = async (): Promise<
    [SignerWithAddress, KannaStockOptionManager]
  > => {
    const [userWallet] = await ethers.getSigners();

    const userSession = (await ethers.getContractAt(
      'KannaStockOptionManager',
      stockOptionManager.address,
      userWallet
    )) as KannaStockOptionManager;

    return [userWallet, userSession];
  };

  const setDefaultTemplate = async () => {
    baseStockOption = await stockOptionFactory.deploy();
    await baseStockOption.deployed();

    await stockOptionManager.updateTemplate(baseStockOption.address);
  };

  const getContractRegisteredEvent = async (tx: ContractTransaction) => {
    const receipt = await tx.wait();

    const registerEvent = (receipt?.events ?? []).find(
      (e) => e.event === 'ContractRegistered'
    ) as ContractRegisteredEvent;

    return registerEvent;
  };

  describe("Setup", async () => {
    beforeEach(async () => {
      await deployContracts();
    });

    describe("contract template", async () => {
      it("should update", async () => {
        const stockOption = await stockOptionFactory.deploy();
        await stockOption.deployed();

        expect(stockOptionManager.updateTemplate(stockOption.address))
          .to.emit(stockOptionManager, 'ContractTemplateUpdated')
          .withArgs(
            stockOption.address
          );
      });

      it("should check contract interface", async () => {
        expect(stockOptionManager.updateTemplate(token.address))
          .to.be.revertedWith(
            '`_contractTemplate` needs to implement `IKannaStockOption` interface'
          );
      });
    });

    describe("register contract", async () => {
      it("should register new contract", async () => {
        const stockOption = await stockOptionFactory.deploy();
        await stockOption.deployed();

        await expect(stockOptionManager.registerContract(stockOption.address))
          .to.emit(stockOptionManager, 'ContractRegistered')
          .withArgs(
            stockOption.address,
            1
          );

        const hasContract = await stockOptionManager.hasContract(stockOption.address);

        expect(hasContract).true;
      });

      it("should register new contract unsafe", async () => {
        await expect(stockOptionManager.registerContractUnsafe(token.address))
          .to.emit(stockOptionManager, 'ContractRegistered')
          .withArgs(
            token.address,
            1
          );

        const hasContract = await stockOptionManager.hasContract(token.address);

        expect(hasContract).true;
      });

      it("should unregister contract", async () => {
        const stockOption1 = await stockOptionFactory.deploy();
        await stockOption1.deployed();

        await stockOptionManager.registerContract(stockOption1.address);

        const stockOption2 = await stockOptionFactory.deploy();
        await stockOption2.deployed();

        await stockOptionManager.registerContract(stockOption2.address);

        await expect(stockOptionManager.unregisterContract(stockOption2.address))
          .to.emit(stockOptionManager, 'ContractUnregistered')
          .withArgs(
            stockOption2.address
          );

        const hasContract1 = await stockOptionManager.hasContract(stockOption1.address);

        expect(hasContract1).true;

        const hasContract2 = await stockOptionManager.hasContract(stockOption2.address);

        expect(hasContract2).false;
      });

      it("should return contracts array", async () => {
        const contrac1 = await stockOptionFactory.deploy();
        await contrac1.deployed();

        stockOptionManager.registerContract(contrac1.address);

        const contrac2 = await stockOptionFactory.deploy();
        await contrac2.deployed();

        stockOptionManager.registerContract(contrac2.address);

        const contrac3 = await stockOptionFactory.deploy();
        await contrac3.deployed();

        stockOptionManager.registerContract(contrac3.address);

        let contracts = await stockOptionManager.contracts();

        expect(contracts.length).to.eq(3);
        expect(contracts).to.have.members([
          contrac1.address,
          contrac2.address,
          contrac3.address,
        ]);

        stockOptionManager.unregisterContract(contrac2.address);

        contracts = await stockOptionManager.contracts();

        expect(contracts.length).to.eq(2);
        expect(contracts).to.have.members([
          contrac1.address,
          contrac3.address,
        ]);
      });

      describe("should not", async () => {
        it("register invalid contract", async () => {
          await expect(stockOptionManager.registerContract(token.address))
            .to.be.rejectedWith(
              '`_contract` needs to implement `IKannaStockOption` interface'
            );
        });

        it("register contract twice", async () => {
          const stockOption = await stockOptionFactory.deploy();
          await stockOption.deployed();

          await stockOptionManager.registerContract(stockOption.address);

          await expect(stockOptionManager.registerContract(stockOption.address))
            .to.be.revertedWith(
              'Contract already registered'
            );
        });

        it("unregister not registered contract", async () => {
          await expect(stockOptionManager.unregisterContract(token.address))
            .to.be.revertedWith(
              'Contract not registered'
            );
        });
      });
    });

    describe("deploy contract", async () => {
      it("should deploy a new stock option contract", async () => {
        await setDefaultTemplate();

        const tx = await stockOptionManager.deployContract();

        const event = await getContractRegisteredEvent(tx);

        await expect(tx)
          .to.emit(stockOptionManager, 'ContractRegistered')
          .withArgs(
            event.args.contractAddress,
            1
          );
      });

      it("should initialize a new deployed contract", async () => {
        await setDefaultTemplate();

        const tx = await stockOptionManager.deployContract();
        const event = await getContractRegisteredEvent(tx);

        const stockOption = KannaStockOption__factory.connect(event.args.contractAddress, treasuryWallet);

        const blockTimestamp = (await ethers.provider.getBlock('latest')).timestamp;

        const daysOfCliff = 90;
        const daysOfVesting = 365;
        const daysOfLock = 60;
        const startDate = blockTimestamp;
        const integerAmount = 100;

        const amount = parse1e18(integerAmount);

        await token.connect(treasuryWallet).increaseAllowance(stockOption.address, amount);

        const initializeTx = stockOption.connect(treasuryWallet).initialize(
          token.address,
          startDate,
          daysOfVesting,
          daysOfCliff,
          daysOfLock,
          10,
          amount,
          holder.address
        );

        await expect(initializeTx)
          .to.emit(stockOption, 'OwnershipTransferred')
          .withArgs(
            ethers.constants.AddressZero,
            treasuryWallet.address,
          );

        await expect(initializeTx)
          .to.emit(stockOption, 'Initialize')
          .withArgs(
            token.address,
            startDate,
            daysOfVesting,
            daysOfCliff,
            daysOfLock,
            10,
            amount,
            holder.address,
            () => true
          );
      });

      it("should revert if template not defined", async () => {
        await expect(stockOptionManager.deployContract())
          .to.be.revertedWith(
            'Contract template not defined'
          );
      });
    });

    describe("should aggregate", async () => {
      it("total vested", async () => {
        const totalVested = await stockOptionManager.totalVested();

        expect(totalVested).to.eq(0);
      });

      it("available to withdraw", async () => {
        const availableToWithdraw = await stockOptionManager.availableToWithdraw();

        expect(availableToWithdraw).to.eq(0);
      });

      it("vesting forecast", async () => {
        const blockTimestamp = (await ethers.provider.getBlock('latest')).timestamp;
        const forecastDate = new Date(blockTimestamp * 1000);

        const vestingForecast = await stockOptionManager.vestingForecast(Math.floor(forecastDate.getTime() / 1000));

        expect(vestingForecast).to.eq(0);
      });

      describe("with mocks", async () => {
        beforeEach(async () => {
          const contract1 = await getKannaStockOptionMock(deployer);
          const contract2 = await getKannaStockOptionMock(deployer);

          await contract1.mock.supportsInterface.returns(true);
          await contract2.mock.supportsInterface.returns(true);

          await contract1.mock.totalVested.returns(100);
          await contract2.mock.totalVested.returns(50);

          await contract1.mock.availableToWithdraw.returns(50);
          await contract2.mock.availableToWithdraw.returns(0);

          await contract1.mock.vestingForecast.returns(75);
          await contract2.mock.vestingForecast.returns(20);

          await stockOptionManager.registerContract(contract1.address);
          await stockOptionManager.registerContract(contract2.address);
        });

        it("total vested", async () => {
          const totalVested = await stockOptionManager.totalVested();

          expect(totalVested).to.eq(150);
        });

        it("available to withdraw", async () => {
          const availableToWithdraw = await stockOptionManager.availableToWithdraw();

          expect(availableToWithdraw).to.eq(50);
        });

        it("vesting forecast", async () => {
          const blockTimestamp = (await ethers.provider.getBlock('latest')).timestamp;
          const forecastDate = new Date(blockTimestamp * 1000);

          const vestingForecast = await stockOptionManager.vestingForecast(Math.floor(forecastDate.getTime() / 1000));

          expect(vestingForecast).to.eq(95);
        });
      });

      describe("with not initialized contract", async () => {
        beforeEach(async () => {
          const stockOption = await stockOptionFactory.deploy();
          await stockOption.deployed();

          await stockOptionManager.registerContract(stockOption.address);
        });

        it("total vested", async () => {
          const totalVested = await stockOptionManager.totalVested();

          expect(totalVested).to.eq(0);
        });

        it("available to withdraw", async () => {
          const availableToWithdraw = await stockOptionManager.availableToWithdraw();

          expect(availableToWithdraw).to.eq(0);
        });

        it("vesting forecast", async () => {
          const blockTimestamp = (await ethers.provider.getBlock('latest')).timestamp;
          const forecastDate = new Date(blockTimestamp * 1000);

          const vestingForecast = await stockOptionManager.vestingForecast(Math.floor(forecastDate.getTime() / 1000));

          expect(vestingForecast).to.eq(0);
        });
      });

      describe("with invalid contract", async () => {
        beforeEach(async () => {
          await stockOptionManager.registerContractUnsafe(token.address);
        });

        it("total vested", async () => {
          const totalVested = await stockOptionManager.totalVested();

          expect(totalVested).to.eq(0);
        });

        it("available to withdraw", async () => {
          const availableToWithdraw = await stockOptionManager.availableToWithdraw();

          expect(availableToWithdraw).to.eq(0);
        });

        it("vesting forecast", async () => {
          const blockTimestamp = (await ethers.provider.getBlock('latest')).timestamp;
          const forecastDate = new Date(blockTimestamp * 1000);

          const vestingForecast = await stockOptionManager.vestingForecast(Math.floor(forecastDate.getTime() / 1000));

          expect(vestingForecast).to.eq(0);
        });
      });
    });

    describe('should prevent not owner', () => {
      const revertWith = 'Ownable: caller is not the owner';

      it('update template', async () => {
        const [, userSession] = await getUserSession();

        await expect(
          userSession.updateTemplate(ethers.Wallet.createRandom().address)
        ).to.revertedWith(revertWith);
      });

      it('register contract', async () => {
        const [, userSession] = await getUserSession();

        await expect(
          userSession.registerContract(ethers.Wallet.createRandom().address)
        ).to.revertedWith(revertWith);
      });

      it('register contract unsafe', async () => {
        const [, userSession] = await getUserSession();

        await expect(
          userSession.registerContractUnsafe(ethers.Wallet.createRandom().address)
        ).to.revertedWith(revertWith);
      });

      it('unregister contract', async () => {
        const [, userSession] = await getUserSession();

        await expect(
          userSession.unregisterContract(ethers.Wallet.createRandom().address)
        ).to.revertedWith(revertWith);
      });

      it('deploy contract', async () => {
        const [, userSession] = await getUserSession();

        await expect(
          userSession.deployContract()
        ).to.revertedWith(revertWith);
      });
    });
  });
});
