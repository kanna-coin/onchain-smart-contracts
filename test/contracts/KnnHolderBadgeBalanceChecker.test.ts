import { ethers } from 'hardhat';
import { utils } from 'ethers';
import { MockContract } from 'ethereum-waffle';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import {
  KnnHolderBadgeChecker,
  IERC165__factory,
  IDynamicBadgeChecker__factory,
} from '../../typechain-types';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import {
  getKnnHolderBadgeCheckerFactory,
  getKnnHolderBadgeChecker,
  getKnnTokenMock,
} from '../../src/infrastructure/factories';

chai.use(chaiAsPromised);
const { expect } = chai;

export function getInterfaceID(...contractInterfaces: utils.Interface[]) {
  let interfaceID = ethers.constants.Zero;

  for (const contractInterface of contractInterfaces) {
    const functions = Object.keys(contractInterface.functions);

    for (let i = 0; i < functions.length; i++) {
      interfaceID = interfaceID.xor(contractInterface.getSighash(functions[i]));
    }
  }

  return interfaceID._hex.padEnd(10, '0');
}

describe('Knn Holder Badge Checker', () => {
  let signers: SignerWithAddress[];
  let knnToken: MockContract;
  let holderChecker: KnnHolderBadgeChecker;

  const deployContracts = async () => {
    signers = await ethers.getSigners();

    const [deployerWallet] = signers;

    knnToken = await getKnnTokenMock(deployerWallet);

    holderChecker = await getKnnHolderBadgeChecker(deployerWallet, knnToken);
  };

  const getDeployerWallet = async () => {
    const [deployerWallet] = signers;

    return deployerWallet;
  };

  const getUserWallet = async () => {
    const [, userAccount] = signers;

    return userAccount;
  };

  describe('Setup', async () => {
    beforeEach(async () => {
      await deployContracts();
    });

    it('should not initialize Holder Checker with invalid token address', async () => {
      const deployerWallet = await getDeployerWallet();

      const holderCheckerFactory = await getKnnHolderBadgeCheckerFactory(
        deployerWallet
      );

      await expect(
        holderCheckerFactory.deploy(
          ethers.constants.AddressZero,
          ethers.constants.AddressZero
        )
      ).to.be.revertedWith('Invalid token address');
    });

    it('should return `false` when `isAccumulative`', async () => {
      const accumulative = await holderChecker.isAccumulative();

      expect(accumulative).to.eq(false);
    });

    describe('Balance of', async () => {
      it('should return `1` if `account` has Knn Token', async () => {
        const userWallet = await getUserWallet();

        await knnToken.mock.balanceOf
          .withArgs(userWallet.address)
          .returns(ethers.BigNumber.from(10));

        const balance = await holderChecker.balanceOf(userWallet.address, 0);

        expect(balance).to.eq(1);
      });

      it('should return `0` if `account` does not have Knn Token', async () => {
        const userWallet = await getUserWallet();

        await knnToken.mock.balanceOf
          .withArgs(userWallet.address)
          .returns(ethers.BigNumber.from(0));

        const balance = await holderChecker.balanceOf(userWallet.address, 0);

        expect(balance).to.eq(0);
      });
    });

    describe('Creator', async () => {
      it('should return the creator', async () => {
        const creator = await holderChecker.creator();
        expect(creator).not.null;
      });
    });

    describe('RoyaltyPercent', async () => {
      it('should return the royalty percent', async () => {
        const royaltyPercent = await holderChecker.royaltyPercent();
        expect(royaltyPercent).not.null;
      });
    });

    describe('Supports interface', async () => {
      it('Dynamic Badge Checker interface', async () => {
        const IERC165Interface = IERC165__factory.createInterface();
        const DynamicCheckerInterface =
          IDynamicBadgeChecker__factory.createInterface();

        const interfaceId = getInterfaceID(
          DynamicCheckerInterface,
          IERC165Interface
        );

        const supportsInterface = await holderChecker.supportsInterface(
          interfaceId
        );

        expect(supportsInterface).to.eq(true);
      });
    });
  });
});
