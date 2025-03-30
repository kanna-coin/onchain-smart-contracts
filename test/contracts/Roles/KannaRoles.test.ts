import { ethers } from 'hardhat';
import { constants, utils, Wallet } from 'ethers';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { MockContract } from 'ethereum-waffle';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { KannaRoles } from '../../../typechain-types';
import { getKannaRoleProvierMock, getKannaRoles } from '../../../src/infrastructure/factories';

chai.use(chaiAsPromised);
const { expect } = chai;

const encodeRole = (role: string | string[]) => {
  const type = typeof role === 'string' ? 'string' : 'string[]';

  return utils.defaultAbiCoder.encode([type], [role]);
};

describe('Kanna Roles', () => {
  let signers: SignerWithAddress[];
  let kannaRoles: KannaRoles;

  const deployContracts = async () => {
    signers = await ethers.getSigners();

    const [deployerWallet] = signers;

    kannaRoles = await getKannaRoles(deployerWallet);
  };

  const getDeployerWallet = async () => {
    const [deployerWallet] = signers;

    return deployerWallet;
  };

  const getUserWallet = async () => {
    const [, userAccount] = signers;

    return userAccount;
  };

  const getUserSession = async (): Promise<
    [SignerWithAddress, KannaRoles]
  > => {
    const userWallet = await getUserWallet();

    const managerSession = (await ethers.getContractAt(
      'KannaRoles',
      kannaRoles.address,
      userWallet
    )) as KannaRoles;

    return [userWallet, managerSession];
  };

  const getUser2Wallet = async () => {
    const [, , userAccount] = signers;

    return userAccount;
  };

  describe('Setup', async () => {
    beforeEach(async () => {
      await deployContracts();
    });

    describe('Grant Role', async () => {
      it('should grant string role', async () => {
        const deployerWallet = await getDeployerWallet();
        const account = await getUserWallet();

        const role = 'ROLE';
        const roleHash = utils.keccak256(encodeRole(role));

        await expect(kannaRoles['grantRole(string,address)'](role, account.address))
          .to.emit(kannaRoles, 'RoleGranted')
          .withArgs(roleHash, account.address, deployerWallet.address);

        const hasRole = await kannaRoles['hasRole(string,address)'](role, account.address);

        expect(hasRole).to.be.true;
      });

      it('should grant string array role', async () => {
        const deployerWallet = await getDeployerWallet();
        const account = await getUserWallet();

        const role = ['ROLE', 'ROLE2'];
        const roleHash = utils.keccak256(encodeRole(role));

        await expect(kannaRoles['grantRole(string[],address)'](role, account.address))
          .to.emit(kannaRoles, 'RoleGranted')
          .withArgs(roleHash, account.address, deployerWallet.address);


        const hasRole = await kannaRoles['hasRole(string[],address)'](role, account.address);

        expect(hasRole).to.be.true;
      });

      it('should grant string role to accounts', async () => {
        const deployerWallet = await getDeployerWallet();
        const account = await getUserWallet();
        const account2 = await getUser2Wallet();

        const role = 'ROLE';
        const roleHash = utils.keccak256(encodeRole(role));

        await expect(kannaRoles['grantRole(string,address[])'](role, [account.address, account2.address]))
          .to.emit(kannaRoles, 'RoleGranted')
          .withArgs(roleHash, account.address, deployerWallet.address)
          .to.emit(kannaRoles, 'RoleGranted')
          .withArgs(roleHash, account2.address, deployerWallet.address);


        for (const address of [account.address, account2.address]) {
          const hasRole = await kannaRoles['hasRole(string,address)'](role, address);

          expect(hasRole).to.be.true;
        }
      });

      it('should grant string array role to accounts', async () => {
        const deployerWallet = await getDeployerWallet();
        const account = await getUserWallet();
        const account2 = await getUser2Wallet();

        const role = ['ROLE', 'ROLE2'];
        const roleHash = utils.keccak256(encodeRole(role));

        await expect(kannaRoles['grantRole(string[],address[])'](role, [account.address, account2.address]))
          .to.emit(kannaRoles, 'RoleGranted')
          .withArgs(roleHash, account.address, deployerWallet.address)
          .to.emit(kannaRoles, 'RoleGranted')
          .withArgs(roleHash, account2.address, deployerWallet.address);

        for (const address of [account.address, account2.address]) {
          const hasRole = await kannaRoles['hasRole(string[],address)'](role, address);

          expect(hasRole).to.be.true;
        }
      });
    });

    describe('Revoke Role', async () => {
      it('should revoke string role', async () => {
        const deployerWallet = await getDeployerWallet();
        const account = await getUserWallet();

        const role = 'ROLE';
        const roleHash = utils.keccak256(encodeRole(role));

        await kannaRoles['grantRole(string,address)'](role, account.address);

        await expect(kannaRoles['revokeRole(string,address)'](role, account.address))
          .to.emit(kannaRoles, 'RoleRevoked')
          .withArgs(roleHash, account.address, deployerWallet.address);
      });

      it('should revoke string array role', async () => {
        const deployerWallet = await getDeployerWallet();
        const account = await getUserWallet();

        const role = ['ROLE', 'ROLE2'];
        const roleHash = utils.keccak256(encodeRole(role));

        await kannaRoles['grantRole(string[],address)'](role, account.address);

        await expect(kannaRoles['revokeRole(string[],address)'](role, account.address))
          .to.emit(kannaRoles, 'RoleRevoked')
          .withArgs(roleHash, account.address, deployerWallet.address);

      });

      it('should revoke string role to accounts', async () => {
        const deployerWallet = await getDeployerWallet();
        const account = await getUserWallet();
        const account2 = await getUser2Wallet();

        const role = 'ROLE';
        const roleHash = utils.keccak256(encodeRole(role));

        await kannaRoles['grantRole(string,address[])'](role, [account.address, account2.address]);

        await expect(kannaRoles['revokeRole(string,address[])'](role, [account.address, account2.address]))
          .to.emit(kannaRoles, 'RoleRevoked')
          .withArgs(roleHash, account.address, deployerWallet.address)
          .to.emit(kannaRoles, 'RoleRevoked')
          .withArgs(roleHash, account2.address, deployerWallet.address);
      });

      it('should revoke string array role to accounts', async () => {
        const deployerWallet = await getDeployerWallet();
        const account = await getUserWallet();
        const account2 = await getUser2Wallet();

        const role = ['ROLE', 'ROLE2'];
        const roleHash = utils.keccak256(encodeRole(role));

        await kannaRoles['grantRole(string[],address[])'](role, [account.address, account2.address]);

        await expect(kannaRoles['revokeRole(string[],address[])'](role, [account.address, account2.address]))
          .to.emit(kannaRoles, 'RoleRevoked')
          .withArgs(roleHash, account.address, deployerWallet.address)
          .to.emit(kannaRoles, 'RoleRevoked')
          .withArgs(roleHash, account2.address, deployerWallet.address);
      });
    });

    describe('Set Admin Role', async () => {
      it("should set admin role (string,string)", async () => {
        const role = 'ROLE';
        const adminRole = 'ADMIN';

        await expect(kannaRoles['setRoleAdmin(string,string)'](role, adminRole))
          .to.emit(kannaRoles, 'RoleAdminChanged')
          .withArgs(
            utils.keccak256(encodeRole(role)),
            constants.HashZero,
            utils.keccak256(encodeRole(adminRole)),
          );

        const newAdminRole = 'ADMIN2';

        await expect(kannaRoles['setRoleAdmin(string,string)'](role, newAdminRole))
          .to.emit(kannaRoles, 'RoleAdminChanged')
          .withArgs(
            utils.keccak256(encodeRole(role)),
            utils.keccak256(encodeRole(adminRole)),
            utils.keccak256(encodeRole(newAdminRole)),
          );
      });

      it("should set admin role (string[],string)", async () => {
        const role = ['ROLE', 'ROLE2'];
        const adminRole = 'ADMIN';

        await expect(kannaRoles['setRoleAdmin(string[],string)'](role, adminRole))
          .to.emit(kannaRoles, 'RoleAdminChanged')
          .withArgs(
            utils.keccak256(encodeRole(role)),
            constants.HashZero,
            utils.keccak256(encodeRole(adminRole)),
          );
      });

      it("should set admin role (string,string[])", async () => {
        const role = 'ROLE';
        const adminRole = ['ADMIN', 'ADMIN2'];

        await expect(kannaRoles['setRoleAdmin(string,string[])'](role, adminRole))
          .to.emit(kannaRoles, 'RoleAdminChanged')
          .withArgs(
            utils.keccak256(encodeRole(role)),
            constants.HashZero,
            utils.keccak256(encodeRole(adminRole)),
          );
      });

      it("should set admin role (string[],string[])", async () => {
        const role = ['ROLE', 'ROLE2'];
        const adminRole = ['ADMIN', 'ADMIN2'];

        await expect(kannaRoles['setRoleAdmin(string[],string[])'](role, adminRole))
          .to.emit(kannaRoles, 'RoleAdminChanged')
          .withArgs(
            utils.keccak256(encodeRole(role)),
            constants.HashZero,
            utils.keccak256(encodeRole(adminRole)),
          );
      });
    });

    describe('Role provider', async () => {
      let roleProvider: MockContract;

      beforeEach(async () => {
        const deployerWallet = await getDeployerWallet();

        roleProvider = await getKannaRoleProvierMock(deployerWallet);

        await roleProvider.mock.supportsInterface.returns(true);
      });

      it("should register provider (string,address)", async () => {
        const deployerWallet = await getDeployerWallet();

        const role = 'ROLE';

        await expect(kannaRoles['registerProvider(string,address)'](role, roleProvider.address))
          .to.emit(kannaRoles, 'RoleProviderChanged')
          .withArgs(
            utils.keccak256(encodeRole(role)),
            constants.AddressZero,
            roleProvider.address,
          );

        const newRoleProvider = await getKannaRoleProvierMock(deployerWallet);

        await newRoleProvider.mock.supportsInterface.returns(true);

        await expect(kannaRoles['registerProvider(string,address)'](role, newRoleProvider.address))
          .to.emit(kannaRoles, 'RoleProviderChanged')
          .withArgs(
            utils.keccak256(encodeRole(role)),
            roleProvider.address,
            newRoleProvider.address
          );
      });

      it("should register provider (string[],address)", async () => {
        const role = ['ROLE', 'ROLE2'];

        await expect(kannaRoles['registerProvider(string[],address)'](role, roleProvider.address))
          .to.emit(kannaRoles, 'RoleProviderChanged')
          .withArgs(
            utils.keccak256(encodeRole(role)),
            constants.AddressZero,
            roleProvider.address,
          );
      });

      it("should verify role from provider", async () => {
        const account = await getUserWallet();

        const role = 'ROLE';

        await kannaRoles['registerProvider(string,address)'](role, roleProvider.address);

        await roleProvider.mock.hasRole.withArgs(utils.keccak256(encodeRole(role)), account.address).returns(true);

        const hasRole = await kannaRoles['hasRole(string,address)'](role, account.address);

        expect(hasRole).to.be.true;
      });

      describe("should not", async () => {
        it("register invalid role provider", async () => {
          const deployerWallet = await getDeployerWallet();

          const invalidRoleProvider = await getKannaRoleProvierMock(deployerWallet);

          await invalidRoleProvider.mock.supportsInterface.returns(false);

          const role = 'ROLE';

          await expect(
            kannaRoles['registerProvider(string,address)'](role, invalidRoleProvider.address)
          ).to.revertedWith(
            '`providerAddress` needs to implement `IKannaRoleProvier` interface'
          );
        });

        it("register empty address", async () => {
          const deployerWallet = await getDeployerWallet();

          const invalidRoleProvider = await getKannaRoleProvierMock(deployerWallet);

          await invalidRoleProvider.mock.supportsInterface.returns(false);

          const role = 'ROLE';

          await expect(
            kannaRoles['registerProvider(string,address)'](role, constants.AddressZero)
          ).to.revertedWith(
            'Invalid address'
          );
        });
      });
    });

    describe('should prevent not owner', () => {
      const revertWith = 'Ownable: caller is not the owner';

      it('grant role (string,address)', async () => {
        const [account, userSession] = await getUserSession();

        const role = 'ROLE';

        await expect(
          userSession['grantRole(string,address)'](role, account.address)
        ).to.revertedWith(revertWith);
      });

      it('grant role (string[],address)', async () => {
        const [account, userSession] = await getUserSession();

        const role = ['ROLE', 'ROLE2'];

        await expect(
          userSession['grantRole(string[],address)'](role, account.address)
        ).to.revertedWith(revertWith);
      });

      it('grant role (string,address[])', async () => {
        const [account, userSession] = await getUserSession();
        const account2 = await getUser2Wallet();

        const role = 'ROLE';

        await expect(
          userSession['grantRole(string,address[])'](role, [account.address, account2.address])
        ).to.revertedWith(revertWith);
      });

      it('grant role (string[],address[])', async () => {
        const [account, userSession] = await getUserSession();
        const account2 = await getUser2Wallet();

        const role = ['ROLE', 'ROLE2'];

        await expect(
          userSession['grantRole(string[],address[])'](role, [account.address, account2.address])
        ).to.revertedWith(revertWith);
      });

      it('revoke role (string,address)', async () => {
        const [account, userSession] = await getUserSession();

        const role = 'ROLE';

        await expect(
          userSession['revokeRole(string,address)'](role, account.address)
        ).to.revertedWith(revertWith);
      });

      it('revoke role (string[],address)', async () => {
        const [account, userSession] = await getUserSession();

        const role = ['ROLE', 'ROLE2'];

        await expect(
          userSession['revokeRole(string[],address)'](role, account.address)
        ).to.revertedWith(revertWith);
      });

      it('revoke role (string,address[])', async () => {
        const [account, userSession] = await getUserSession();
        const account2 = await getUser2Wallet();

        const role = 'ROLE';

        await expect(
          userSession['revokeRole(string,address[])'](role, [account.address, account2.address])
        ).to.revertedWith(revertWith);
      });

      it('revoke role (string[],address[])', async () => {
        const [account, userSession] = await getUserSession();
        const account2 = await getUser2Wallet();

        const role = ['ROLE', 'ROLE2'];

        await expect(
          userSession['revokeRole(string[],address[])'](role, [account.address, account2.address])
        ).to.revertedWith(revertWith);
      });

      it('set admin role (string,string)', async () => {
        const [, userSession] = await getUserSession();

        const role = 'ROLE';
        const adminRole = 'ADMIN';

        await expect(
          userSession['setRoleAdmin(string,string)'](role, adminRole)
        ).to.revertedWith(revertWith);
      });

      it('set admin role (string[],string)', async () => {
        const [, userSession] = await getUserSession();

        const role = ['ROLE', 'ROLE2'];
        const adminRole = 'ADMIN';

        await expect(
          userSession['setRoleAdmin(string[],string)'](role, adminRole)
        ).to.revertedWith(revertWith);
      });

      it('set admin role (string,string[])', async () => {
        const [, userSession] = await getUserSession();

        const role = 'ROLE';
        const adminRole = ['ADMIN', 'ADMIN2'];

        await expect(
          userSession['setRoleAdmin(string,string[])'](role, adminRole)
        ).to.revertedWith(revertWith);
      });

      it('set admin role (string[],string[])', async () => {
        const [, userSession] = await getUserSession();

        const role = ['ROLE', 'ROLE2'];
        const adminRole = ['ADMIN', 'ADMIN2'];

        await expect(
          userSession['setRoleAdmin(string[],string[])'](role, adminRole)
        ).to.revertedWith(revertWith);
      });

      it('register provider (string,address)', async () => {
        const [, userSession] = await getUserSession();
        const wallet = Wallet.createRandom();

        const role = 'ROLE';

        await expect(
          userSession['registerProvider(string,address)'](role, wallet.address)
        ).to.revertedWith(revertWith);
      });

      it('register provider (string[],address)', async () => {
        const [, userSession] = await getUserSession();
        const wallet = Wallet.createRandom();

        const role = ['ROLE', 'ROLE2'];

        await expect(
          userSession['registerProvider(string[],address)'](role, wallet.address)
        ).to.revertedWith(revertWith);
      });
    });
  });
});