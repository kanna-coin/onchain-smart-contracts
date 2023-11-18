import { ethers, network } from 'hardhat';
import { BigNumberish, ContractTransaction, constants, utils } from 'ethers';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { KannaBadges, KannaBadgesL2 } from '../../typechain-types';
import { TokenRegisteredEvent } from '../../typechain-types/contracts/KannaBadgesL2';
import { getKannaBadgesL2 } from '../../src/infrastructure/factories';

chai.use(chaiAsPromised);
const { expect } = chai;

const MINT_TYPEHASH = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Mint(address to, uint16 id, uint256 amount, uint16 incremental, uint256 dueDate, uint256 nonce, uint256 chainId)"));

const getRandomNonce = () => {
  const hex32nonce = ethers.utils.hexlify(ethers.utils.randomBytes(32));
  const uint256Nonce = ethers.BigNumber.from(hex32nonce).sub(ethers.BigNumber.from('1'));

  return uint256Nonce;
}

const mintHash = (address: string, id: BigNumberish, amount: BigNumberish, incremental: number, dueDate: BigNumberish) => {
  const nonce = getRandomNonce();
  const messageHash = ethers.utils.keccak256(
    ethers.utils.defaultAbiCoder.encode(
      ['bytes32', 'address', 'uint16', 'uint256', 'uint16', 'uint256', 'uint256', 'uint256'],
      [MINT_TYPEHASH, address, id, amount, incremental, dueDate, nonce, ethers.provider.network.chainId]
    )
  );

  return [messageHash, nonce];
};

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

const tokensTemplate = [
  {
    transferable: false,
    accumulative: false,
    creator: constants.AddressZero,
    royaltyPercent: 0,
  },
  {
    transferable: true,
    accumulative: true,
    creator: ethers.Wallet.createRandom().address,
    royaltyPercent: 1_000,
  },
  {
    transferable: true,
    accumulative: false,
    creator: ethers.Wallet.createRandom().address,
    royaltyPercent: 1_000,
  },
  {
    transferable: false,
    accumulative: true,
    creator: ethers.Wallet.createRandom().address,
    royaltyPercent: 0,
  },
];

describe('Kanna Badges L2', () => {
  let signers: SignerWithAddress[];
  let kannaBadges: KannaBadgesL2;
  let tokens: KannaBadges.TokenStruct[];

  const deployContracts = async () => {
    signers = await ethers.getSigners();

    const [deployerWallet] = signers;

    kannaBadges = await getKannaBadgesL2(deployerWallet);
  };

  const getManagerSession = async (): Promise<
    [SignerWithAddress, KannaBadgesL2]
  > => {
    const [, managerWallet] = signers;

    await kannaBadges.addManager(managerWallet.address);

    const managerSession = (await ethers.getContractAt(
      'KannaBadgesL2',
      kannaBadges.address,
      managerWallet
    )) as KannaBadgesL2;

    return [managerWallet, managerSession];
  };

  const getMinterSession = async (): Promise<
    [SignerWithAddress, KannaBadgesL2]
  > => {
    const [, , minterWallet] = signers;

    await kannaBadges.addMinter(minterWallet.address);

    const minterSession = (await ethers.getContractAt(
      'KannaBadgesL2',
      kannaBadges.address,
      minterWallet
    )) as KannaBadgesL2;

    return [minterWallet, minterSession];
  };

  const getUserWallet = async () => {
    const [, , , userAccount] = signers;

    return userAccount;
  };

  const getUserSession = async (): Promise<
    [SignerWithAddress, KannaBadgesL2]
  > => {
    const userWallet = await getUserWallet();

    const managerSession = (await ethers.getContractAt(
      'KannaBadgesL2',
      kannaBadges.address,
      userWallet
    )) as KannaBadgesL2;

    return [userWallet, managerSession];
  };

  const getUser2Wallet = async () => {
    const [, , , , userAccount] = signers;

    return userAccount;
  };

  const getTokenRegisteredEvent = async (tx: ContractTransaction) => {
    const receipt = await tx.wait();

    const registerEvent = (receipt?.events ?? []).find(
      (e) => e.event === 'TokenRegistered'
    ) as TokenRegisteredEvent;

    return registerEvent;
  };

  const registerTokens = async () => {
    const [, managerSession] = await getManagerSession();

    for await (const token of tokensTemplate) {
      const tx = await managerSession['register(bool,bool,address,uint256)'](
        token.transferable,
        token.accumulative,
        token.creator,
        token.royaltyPercent
      );

      const event = await getTokenRegisteredEvent(tx);

      tokens.push({
        id: event.args.id,
        transferable: event.args.transferable,
        accumulative: event.args.accumulative,
        creator: event.args.creator,
        royaltyPercent: event.args.royaltyPercent,
      });
    }
  };

  const getTokenId = (tokenType: Partial<KannaBadges.TokenStruct> = {}) => {
    const properties = Object.keys(
      tokenType
    ) as (keyof KannaBadges.TokenStruct)[];

    if (properties.length === 0) {
      return tokens[0].id;
    }

    const token = tokens.find((t) =>
      properties.every((p) => t[p] === tokenType[p])
    );

    if (!token) {
      throw new Error('Token not registered');
    }

    return token.id;
  };

  describe('Setup', async () => {
    beforeEach(async () => {
      await deployContracts();

      tokens = [];
    });

    describe('Mint', async () => {
      beforeEach(async () => {
        await registerTokens();
      });

      it('should mint with signature', async () => {
        const [minterWallet] = await getMinterSession();
        const [userWallet, userSession] = await getUserSession();

        const tokenId = await getTokenId({ accumulative: true });
        const amount = 5;
        const incremental = 1;

        const blockTimestamp = (await ethers.provider.getBlock('latest')).timestamp;

        const dueDate = ethers.BigNumber.from(
          blockTimestamp
        ).add(60 * 60 * 24 * 7);

        const [messageHash, nonce] = mintHash(userWallet.address, tokenId, amount, incremental, dueDate);

        const signature = await minterWallet.signMessage(
          ethers.utils.arrayify(messageHash)
        );

        const tx = userSession[
          'mint(address,uint16,uint256,bytes,uint16,uint256,uint256)'
        ](
          userWallet.address,
          tokenId,
          amount,
          signature,
          incremental,
          dueDate,
          nonce
        );

        await expect(tx)
          .to.emit(kannaBadges, 'TransferSingle')
          .withArgs(
            userWallet.address,
            ethers.constants.AddressZero,
            userWallet.address,
            tokenId,
            amount
          );

        await expect(tx)
          .to.emit(kannaBadges, 'Mint')
          .withArgs(userWallet.address, tokenId, amount, incremental);

        const balance = await kannaBadges['balanceOf(address,uint256)'](
          userWallet.address,
          tokenId
        );

        expect(balance).eq(amount);
      });

      describe('should not', async () => {
        describe('without MINTER_ROLE', async () => {
          it('mint with signature', async () => {
            const [userWallet, userSession] = await getUserSession();
            const user2Wallet = await getUser2Wallet();

            const tokenId = await getTokenId({ accumulative: true });
            const amount = 5;
            const incremental = 1;

            const blockTimestamp = (await ethers.provider.getBlock('latest')).timestamp;

            const dueDate = ethers.BigNumber.from(
              blockTimestamp
            ).add(60 * 60 * 24 * 7);

            const [messageHash, nonce] = mintHash(user2Wallet.address, tokenId, amount, incremental, dueDate);

            const signature = await userWallet.signMessage(
              ethers.utils.arrayify(messageHash)
            );

            await expect(
              userSession[
                'mint(address,uint16,uint256,bytes,uint16,uint256,uint256)'
              ](
                user2Wallet.address,
                tokenId,
                amount,
                signature,
                incremental,
                dueDate,
                nonce
              )
            ).to.reverted;
          });
        });

        describe('token not registered', async () => {
          it('mint with signature', async () => {
            const [minterWallet] = await getMinterSession();
            const [userWallet, userSession] = await getUserSession();

            const tokenId = 99;
            const amount = 5;
            const incremental = 1;

            const blockTimestamp = (await ethers.provider.getBlock('latest')).timestamp;

            const dueDate = ethers.BigNumber.from(
              blockTimestamp
            ).add(60 * 60 * 24 * 7);

            const [messageHash, nonce] = mintHash(userWallet.address, tokenId, amount, incremental, dueDate);

            const signature = await minterWallet.signMessage(
              ethers.utils.arrayify(messageHash)
            );

            await expect(
              userSession[
                'mint(address,uint16,uint256,bytes,uint16,uint256,uint256)'
              ](
                userWallet.address,
                tokenId,
                amount,
                signature,
                incremental,
                dueDate,
                nonce
              )
            ).to.revertedWith('Invalid Token');
          });
        });

        describe('invalid incremental mint nonce', () => {
          it('wrong nonce', async () => {
            const [minterWallet] = await getMinterSession();
            const [userWallet, userSession] = await getUserSession();

            const tokenId = await getTokenId({ accumulative: true });
            const amount = 5;
            const incremental = 2;

            const blockTimestamp = (await ethers.provider.getBlock('latest')).timestamp;

            const dueDate = ethers.BigNumber.from(
              blockTimestamp
            ).add(60 * 60 * 24 * 7);

            const [messageHash, nonce] = mintHash(userWallet.address, tokenId, amount, incremental, dueDate);

            const signature = await minterWallet.signMessage(
              ethers.utils.arrayify(messageHash)
            );

            await expect(
              userSession[
                'mint(address,uint16,uint256,bytes,uint16,uint256,uint256)'
              ](
                userWallet.address,
                tokenId,
                amount,
                signature,
                incremental,
                dueDate,
                nonce
              )
            ).to.revertedWith('Invalid Nonce');
          });

          it('using same signature', async () => {
            const [minterWallet] = await getMinterSession();
            const [userWallet, userSession] = await getUserSession();

            const tokenId = await getTokenId({ accumulative: true });
            const amount = 5;
            const incremental = 1;

            const blockTimestamp = (await ethers.provider.getBlock('latest')).timestamp;

            const dueDate = ethers.BigNumber.from(
              blockTimestamp
            ).add(60 * 60 * 24 * 7);

            const [messageHash, nonce] = mintHash(userWallet.address, tokenId, amount, incremental, dueDate);

            const signature = await minterWallet.signMessage(
              ethers.utils.arrayify(messageHash)
            );

            await expect(
              userSession[
                'mint(address,uint16,uint256,bytes,uint16,uint256,uint256)'
              ](
                userWallet.address,
                tokenId,
                amount,
                signature,
                incremental,
                dueDate,
                nonce
              )
            )
              .to.emit(kannaBadges, 'TransferSingle')
              .withArgs(
                userWallet.address,
                ethers.constants.AddressZero,
                userWallet.address,
                tokenId,
                amount
              )
              .to.emit(kannaBadges, 'Mint')
              .withArgs(userWallet.address, tokenId, amount, incremental);

            await expect(
              userSession[
                'mint(address,uint16,uint256,bytes,uint16,uint256,uint256)'
              ](
                userWallet.address,
                tokenId,
                amount,
                signature,
                incremental,
                dueDate,
                nonce
              )
            ).to.revertedWith('Invalid Nonce');
          });
        });

        it('with expired signature', async () => {
          const [minterWallet] = await getMinterSession();
          const [userWallet, userSession] = await getUserSession();

          const tokenId = await getTokenId({ accumulative: true });
          const amount = 5;
          const incremental = 1;

          const blockTimestamp = (await ethers.provider.getBlock('latest')).timestamp;

          const dueDate = ethers.BigNumber.from(
            blockTimestamp
          ).add(60 * 60 * 24 * 7);

          const [messageHash, nonce] = mintHash(userWallet.address, tokenId, amount, incremental, dueDate);

          const signature = await minterWallet.signMessage(
            ethers.utils.arrayify(messageHash)
          );

          await network.provider.request({
            method: 'evm_setNextBlockTimestamp',
            params: [dueDate.add(1).toNumber()],
          });
          await network.provider.send("evm_mine");

          await expect(userSession[
            'mint(address,uint16,uint256,bytes,uint16,uint256,uint256)'
          ](
            userWallet.address,
            tokenId,
            amount,
            signature,
            incremental,
            dueDate,
            nonce
          )).to.revertedWith('Invalid date');

          /* await network.provider.request({
            method: 'evm_setNextBlockTimestamp',
            params: [blockTimestamp],
          });
          await network.provider.send("evm_mine"); */
        });
      });
    });
  });
});
