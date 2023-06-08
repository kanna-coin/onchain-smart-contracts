import { ethers } from "hardhat";
import { ContractTransaction, utils } from "ethers";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  KannaBadges,
  IAccessControl__factory,
  IERC1155__factory,
  IERC1155MetadataURI__factory,
  IERC165__factory,
} from "../../typechain-types";
import { TokenRegisteredEvent } from "../../typechain-types/contracts/KannaBadges";
import { getKannaBadges, getDynamicBadgeCheckerMock } from "../../src/infrastructure/factories";

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

const tokensTemplate = [
  { transferable: false, accumulative: false },
  { transferable: true, accumulative: true },
  { transferable: true, accumulative: false },
  { transferable: false, accumulative: true },
];

describe("Kanna Badges", () => {
  let signers: SignerWithAddress[];
  let kannaBadges: KannaBadges;
  let tokens: KannaBadges.TokenStruct[];

  const deployContracts = async () => {
    signers = await ethers.getSigners();

    const [deployerWallet] = signers;

    kannaBadges = await getKannaBadges(deployerWallet);
  };

  const getDeployerWallet = async () => {
    const [deployerWallet] = signers;

    return deployerWallet;
  };

  const getManagerSession = async (): Promise<
    [SignerWithAddress, KannaBadges]
  > => {
    const [, managerWallet] = signers;

    await kannaBadges.addManager(managerWallet.address);

    const managerSession = (await ethers.getContractAt(
      "KannaBadges",
      kannaBadges.address,
      managerWallet
    )) as KannaBadges;

    return [managerWallet, managerSession];
  };

  const getMinterSession = async (): Promise<
    [SignerWithAddress, KannaBadges]
  > => {
    const [, , minterWallet] = signers;

    await kannaBadges.addMinter(minterWallet.address);

    const minterSession = (await ethers.getContractAt(
      "KannaBadges",
      kannaBadges.address,
      minterWallet
    )) as KannaBadges;

    return [minterWallet, minterSession];
  };

  const getUserWallet = async () => {
    const [, , , userAccount] = signers;

    return userAccount;
  };

  const getUserSession = async (): Promise<
    [SignerWithAddress, KannaBadges]
  > => {
    const userWallet = await getUserWallet();

    const managerSession = (await ethers.getContractAt(
      "KannaBadges",
      kannaBadges.address,
      userWallet
    )) as KannaBadges;

    return [userWallet, managerSession];
  };

  const getUser2Wallet = async () => {
    const [, , , , userAccount] = signers;

    return userAccount;
  };

  const getUser2Session = async (): Promise<
    [SignerWithAddress, KannaBadges]
  > => {
    const userWallet = await getUser2Wallet();

    const managerSession = (await ethers.getContractAt(
      "KannaBadges",
      kannaBadges.address,
      userWallet
    )) as KannaBadges;

    return [userWallet, managerSession];
  };

  const getTokenRegisteredEvent = async (tx: ContractTransaction) => {
    const receipt = await tx.wait();

    const registerEvent = (receipt?.events ?? []).find(e => e.event === 'TokenRegistered') as TokenRegisteredEvent;

    return registerEvent;
  };

  const registerTokens = async () => {
    const [, managerSession] = await getManagerSession();

    for await (const token of tokensTemplate) {
      const tx = await managerSession["register(bool,bool)"](token.transferable, token.accumulative);

      const event = await getTokenRegisteredEvent(tx);

      tokens.push({
        id: event.args.id,
        transferable: event.args.transferable,
        accumulative: event.args.accumulative,
      });
    }
  }

  const getTokenId = (tokenType: Partial<KannaBadges.TokenStruct> = {}) => {
    const properties = Object.keys(tokenType) as (keyof KannaBadges.TokenStruct)[];

    if (properties.length === 0) {
      return tokens[0].id;
    }

    const token = tokens.find(t => properties.every(p => t[p] === tokenType[p]));

    if (!token) {
      throw new Error('Token not registered');
    }

    return token.id;
  };

  describe("Setup", async () => {
    beforeEach(async () => {
      await deployContracts();

      tokens = [];
    });

    describe("Register Token", async () => {

      it("should add manager", async () => {
        const deployerWallet = await getDeployerWallet();
        const userWallet = await getUserWallet();

        const role = await kannaBadges.MANAGER_ROLE;

        await expect(kannaBadges.addManager(userWallet.address))
          .to.emit(kannaBadges, "RoleGranted")
          .withArgs(
            role,
            userWallet.address,
            deployerWallet.address
          )
      });

      it("should remove manager", async () => {
        const deployerWallet = await getDeployerWallet();
        const [managerWallet] = await getManagerSession();

        const role = await kannaBadges.MANAGER_ROLE;

        await expect(kannaBadges.removeManager(managerWallet.address))
          .to.emit(kannaBadges, "RoleRevoked")
          .withArgs(
            role,
            managerWallet.address,
            deployerWallet.address
          )
      });

      it("should register token", async () => {
        const [, managerSession] = await getManagerSession();

        let id = 0;

        for await (const token of tokensTemplate) {
          await expect(managerSession["register(bool,bool)"](token.transferable, token.accumulative))
            .to.emit(kannaBadges, "TokenRegistered")
            .withArgs(
              ++id,
              token.transferable,
              token.accumulative
            );
        }
      });

      it("should register dynamic token", async () => {
        const deployerWallet = await getDeployerWallet();
        const [, managerSession] = await getManagerSession();

        const dynamicChecker = await getDynamicBadgeCheckerMock(deployerWallet);

        await dynamicChecker.mock.isAccumulative.returns(true);

        await expect(managerSession["register(address)"](dynamicChecker.address))
          .to.emit(kannaBadges, "TokenRegistered")
          .withArgs(
            1,
            false,
            true
          );

        await dynamicChecker.mock.isAccumulative.returns(false);

        await expect(managerSession["register(address)"](dynamicChecker.address))
          .to.emit(kannaBadges, "TokenRegistered")
          .withArgs(
            2,
            false,
            false
          );
      });

      it("should list all registered tokens", async () => {
        await registerTokens();

        const registeredTokens = await kannaBadges.tokens();

        expect(
          registeredTokens.map(t => ({
            id: t.id,
            transferable: t.transferable,
            accumulative: t.accumulative,
          }))
        ).to.have.deep.members(tokens);
      });

      describe("should not", async () => {
        it("register invalid dynamic badge checker", async () => {
          const deployerWallet = await getDeployerWallet();
          const [, managerSession] = await getManagerSession();

          const dynamicChecker = await getDynamicBadgeCheckerMock(deployerWallet);

          await dynamicChecker.mock.supportsInterface.returns(false);

          await expect(managerSession["register(address)"](dynamicChecker.address))
            .to.revertedWith('`checkerAddress` needs to implement `IDynamicBadgeChecker` interface');
        });

        describe("without MANAGER_ROLE", async () => {
          it("register", async () => {
            const [, userSession] = await getUserSession();

            await expect(userSession["register(bool,bool)"](false, false))
              .to.reverted;
          });

          it("register dynamic token", async () => {
            const deployerWallet = await getDeployerWallet();
            const [, userSession] = await getUserSession();

            const dynamicChecker = await getDynamicBadgeCheckerMock(deployerWallet);

            await expect(userSession["register(address)"](dynamicChecker.address))
              .to.reverted;
          });
        });
      });
    });

    describe("Set URI", async () => {
      it("should set new URI", async () => {
        const uri = 'https://new-uri/{id}';

        await kannaBadges.setURI(uri);

        const newUri = await kannaBadges.uri(1);

        expect(newUri).eq(uri);
      });

      it("should emit URI event for each registered Token", async () => {
        const uri = 'https://new-uri/{id}';

        await registerTokens();

        const registeredTokens = await kannaBadges.tokens();

        const tx = kannaBadges.setURI(uri);

        for await (const token of registeredTokens) {
          await expect(tx)
            .to.emit(kannaBadges, "URI")
            .withArgs(
              uri,
              token.id
            );
        }
      });
    });

    describe("Mint", async () => {
      beforeEach(async () => {
        await registerTokens();
      });

      it("should add minter", async () => {
        const deployerWallet = await getDeployerWallet();
        const userWallet = await getUserWallet();

        const role = await kannaBadges.MINTER_ROLE;

        await expect(kannaBadges.addMinter(userWallet.address))
          .to.emit(kannaBadges, "RoleGranted")
          .withArgs(
            role,
            userWallet.address,
            deployerWallet.address
          )
      });

      it("should remove minter", async () => {
        const deployerWallet = await getDeployerWallet();
        const [minterWallet] = await getMinterSession();

        const role = await kannaBadges.MINTER_ROLE;

        await expect(kannaBadges.removeMinter(minterWallet.address))
          .to.emit(kannaBadges, "RoleRevoked")
          .withArgs(
            role,
            minterWallet.address,
            deployerWallet.address
          )
      });

      it("should mint", async () => {
        const [minterWallet, minterSession] = await getMinterSession();
        const userWallet = await getUserWallet();

        const tokenId = getTokenId();

        await expect(minterSession["mint(address,uint16)"](userWallet.address, tokenId))
          .to.emit(kannaBadges, "TransferSingle")
          .withArgs(
            minterWallet.address,
            ethers.constants.AddressZero,
            userWallet.address,
            tokenId,
            1
          )
          .to.emit(kannaBadges, "Mint")
          .withArgs(
            userWallet.address,
            tokenId,
            1,
            1
          );

        const balance = await kannaBadges["balanceOf(address,uint256)"](userWallet.address, tokenId);

        expect(balance).eq(1);
      });

      it("should mint with amount", async () => {
        const [minterWallet, minterSession] = await getMinterSession();
        const userWallet = await getUserWallet();

        const tokenId = getTokenId({ accumulative: true });
        const amount = 5;

        await expect(minterSession["mint(address,uint16,uint256)"](userWallet.address, tokenId, amount))
          .to.emit(kannaBadges, "TransferSingle")
          .withArgs(
            minterWallet.address,
            ethers.constants.AddressZero,
            userWallet.address,
            tokenId,
            amount
          )
          .to.emit(kannaBadges, "Mint")
          .withArgs(
            userWallet.address,
            tokenId,
            amount,
            1
          );

        const balance = await kannaBadges["balanceOf(address,uint256)"](userWallet.address, tokenId);

        expect(balance).eq(amount);
      });

      it("should batch mint", async () => {
        const [minterWallet, minterSession] = await getMinterSession();
        const userWallet = await getUserWallet();
        const user2Wallet = await getUser2Wallet();

        const tokenId = getTokenId();

        const tx = minterSession.batchMint(tokenId, [
          userWallet.address,
          user2Wallet.address,
        ]);

        await expect(tx)
          .to.emit(kannaBadges, "TransferSingle")
          .withArgs(
            minterWallet.address,
            ethers.constants.AddressZero,
            userWallet.address,
            tokenId,
            1
          );

        await expect(tx)
          .to.emit(kannaBadges, "TransferSingle")
          .withArgs(
            minterWallet.address,
            ethers.constants.AddressZero,
            user2Wallet.address,
            tokenId,
            1
          );

        await expect(tx)
          .to.emit(kannaBadges, "Mint")
          .withArgs(
            userWallet.address,
            tokenId,
            1,
            1
          );

        await expect(tx)
          .to.emit(kannaBadges, "Mint")
          .withArgs(
            user2Wallet.address,
            tokenId,
            1,
            1
          );

        const balance = await kannaBadges["balanceOf(address,uint256)"](userWallet.address, tokenId);

        expect(balance).eq(1);

        const balance2 = await kannaBadges["balanceOf(address,uint256)"](user2Wallet.address, tokenId);

        expect(balance2).eq(1);
      });

      it("should mint with signature", async () => {
        const [minterWallet] = await getMinterSession();
        const [userWallet, userSession] = await getUserSession();

        const tokenId = getTokenId({ accumulative: true });
        const amount = 5;
        const incremental = 1;

        const nonce = ethers.BigNumber.from(ethers.utils.hexlify(ethers.utils.randomBytes(32))).sub(1);

        const mintTypeHash = ethers.utils.keccak256(
          ethers.utils.toUtf8Bytes("Mint(address to, uint16 id, uint256 amount, uint16 incremental, uint256 nonce)")
        );

        const messageHash = ethers.utils.keccak256(
          ethers.utils.defaultAbiCoder.encode(
            ['bytes32', 'address', 'uint16', 'uint256', 'uint16', 'uint256'],
            [mintTypeHash, userWallet.address, tokenId, amount, incremental, nonce]
          )
        );

        const signature = await minterWallet.signMessage(ethers.utils.arrayify(messageHash));

        const tx = userSession["mint(address,uint16,uint256,bytes,uint16,uint256)"](
          userWallet.address,
          tokenId,
          amount,
          signature,
          incremental,
          nonce,
        );

        await expect(tx)
          .to.emit(kannaBadges, "TransferSingle")
          .withArgs(
            userWallet.address,
            ethers.constants.AddressZero,
            userWallet.address,
            tokenId,
            amount
          );

        await expect(tx)
          .to.emit(kannaBadges, "Mint")
          .withArgs(
            userWallet.address,
            tokenId,
            amount,
            incremental,
          );

        const balance = await kannaBadges["balanceOf(address,uint256)"](userWallet.address, tokenId);

        expect(balance).eq(amount);
      });

      it("should increase mint nonce", async () => {
        const [minterWallet, minterSession] = await getMinterSession();
        const userWallet = await getUserWallet();

        const tokenId = getTokenId({ accumulative: true });

        for (let i = 1; i < 5; i++) {
          const tx = minterSession["mint(address,uint16)"](userWallet.address, tokenId);

          await expect(tx)
            .to.emit(kannaBadges, "TransferSingle")
            .withArgs(
              minterWallet.address,
              ethers.constants.AddressZero,
              userWallet.address,
              tokenId,
              1
            );

          await expect(tx)
            .to.emit(kannaBadges, "Mint")
            .withArgs(
              userWallet.address,
              tokenId,
              1,
              i
            );
        }
      });

      describe("should not", async () => {
        it("dynamic token", async () => {
          const deployerWallet = await getDeployerWallet();
          const [, managerSession] = await getManagerSession();
          const [, minterSession] = await getMinterSession();
          const userWallet = await getUserWallet();


          const dynamicChecker = await getDynamicBadgeCheckerMock(deployerWallet);

          await dynamicChecker.mock.isAccumulative.returns(false);

          const tx = await managerSession["register(address)"](dynamicChecker.address);

          const event = await getTokenRegisteredEvent(tx);

          const tokenId = event.args.id;

          await dynamicChecker.mock.balanceOf.withArgs(userWallet.address, tokenId).returns(0);

          await expect(minterSession["mint(address,uint16)"](userWallet.address, tokenId))
            .to.revertedWith('Token is not mintable');
        });

        describe("without MINTER_ROLE", async () => {
          it("mint", async () => {
            const [, userSession] = await getUserSession();
            const user2Wallet = await getUser2Wallet();

            const tokenId = getTokenId();

            await expect(userSession["mint(address,uint16)"](user2Wallet.address, tokenId))
              .to.reverted;
          });

          it("mint with amount", async () => {
            const [, userSession] = await getUserSession();
            const user2Wallet = await getUser2Wallet();

            const tokenId = getTokenId();

            await expect(userSession["mint(address,uint16,uint256)"](user2Wallet.address, tokenId, 5))
              .to.reverted;
          });

          it("batch mint", async () => {
            const [, userSession] = await getUserSession();
            const user2Wallet = await getUser2Wallet();

            const tokenId = getTokenId();

            await expect(userSession.batchMint(tokenId, [user2Wallet.address]))
              .to.reverted;
          });

          it("mint with signature", async () => {
            const [userWallet, userSession] = await getUserSession();
            const user2Wallet = await getUser2Wallet();

            const tokenId = getTokenId({ accumulative: true });
            const amount = 5;
            const incremental = 1;

            const nonce = ethers.BigNumber.from(ethers.utils.hexlify(ethers.utils.randomBytes(32))).sub(1);

            const mintTypeHash = ethers.utils.keccak256(
              ethers.utils.toUtf8Bytes("Mint(address to, uint16 id, uint256 amount, uint16 incremental, uint256 nonce)")
            );

            const messageHash = ethers.utils.keccak256(
              ethers.utils.defaultAbiCoder.encode(
                ['bytes32', 'address', 'uint16', 'uint256', 'uint16', 'uint256'],
                [mintTypeHash, user2Wallet.address, tokenId, amount, incremental, nonce]
              )
            );

            const signature = await userWallet.signMessage(ethers.utils.arrayify(messageHash));

            await expect(userSession["mint(address,uint16,uint256,bytes,uint16,uint256)"](
              user2Wallet.address,
              tokenId,
              amount,
              signature,
              incremental,
              nonce,
            )).to.reverted;
          });
        });

        describe("token not registered", async () => {
          it("mint", async () => {
            const [, minterSession] = await getMinterSession();
            const userWallet = await getUserWallet();

            const tokenId = 99;

            await expect(minterSession["mint(address,uint16)"](userWallet.address, tokenId))
              .to.revertedWith('Invalid Token');
          });

          it("mint with amount", async () => {
            const [, minterSession] = await getMinterSession();
            const userWallet = await getUserWallet();

            const tokenId = 99;
            const amount = 5;

            await expect(minterSession["mint(address,uint16,uint256)"](userWallet.address, tokenId, amount))
              .to.revertedWith('Invalid Token');
          });

          it("batch mint", async () => {
            const [, minterSession] = await getMinterSession();
            const userWallet = await getUserWallet();
            const user2Wallet = await getUser2Wallet();

            const tokenId = 99;

            await expect(minterSession.batchMint(tokenId, [
              userWallet.address,
              user2Wallet.address,
            ]))
              .to.revertedWith('Invalid Token');
          });

          it("mint with signature", async () => {
            const [minterWallet] = await getMinterSession();
            const [userWallet, userSession] = await getUserSession();

            const tokenId = 99;
            const amount = 5;
            const incremental = 1;

            const nonce = ethers.BigNumber.from(ethers.utils.hexlify(ethers.utils.randomBytes(32))).sub(1);

            const mintTypeHash = ethers.utils.keccak256(
              ethers.utils.toUtf8Bytes("Mint(address to, uint16 id, uint256 amount, uint16 incremental, uint256 nonce)")
            );

            const messageHash = ethers.utils.keccak256(
              ethers.utils.defaultAbiCoder.encode(
                ['bytes32', 'address', 'uint16', 'uint256', 'uint16', 'uint256'],
                [mintTypeHash, userWallet.address, tokenId, amount, incremental, nonce]
              )
            );

            const signature = await minterWallet.signMessage(ethers.utils.arrayify(messageHash));

            await expect(userSession["mint(address,uint16,uint256,bytes,uint16,uint256)"](
              userWallet.address,
              tokenId,
              amount,
              signature,
              incremental,
              nonce,
            ))
              .to.revertedWith('Invalid Token');
          });
        });

        describe("mint not `accumulative` token", async () => {
          it("more than once", async () => {
            const [, minterSession] = await getMinterSession();
            const userWallet = await getUserWallet();

            const tokenId = getTokenId({ accumulative: false });

            await minterSession["mint(address,uint16)"](userWallet.address, tokenId);

            await expect(minterSession["mint(address,uint16)"](userWallet.address, tokenId))
              .to.revertedWith(`Token is not accumulative`);
          });

          it("amount greater than 1", async () => {
            const [, minterSession] = await getMinterSession();
            const userWallet = await getUserWallet();

            const tokenId = getTokenId({ accumulative: false });

            await expect(minterSession["mint(address,uint16,uint256)"](userWallet.address, tokenId, 2))
              .to.revertedWith(`Token is not accumulative`);
          });
        });

        describe("invalid incremental mint nonce", () => {
          it("wrong nonce", async () => {
            const [minterWallet] = await getMinterSession();
            const [userWallet, userSession] = await getUserSession();

            const tokenId = getTokenId({ accumulative: true });
            const amount = 5;
            const incremental = 2;

            const nonce = ethers.BigNumber.from(ethers.utils.hexlify(ethers.utils.randomBytes(32))).sub(1);

            const mintTypeHash = ethers.utils.keccak256(
              ethers.utils.toUtf8Bytes("Mint(address to, uint16 id, uint256 amount, uint16 incremental, uint256 nonce)")
            );

            const messageHash = ethers.utils.keccak256(
              ethers.utils.defaultAbiCoder.encode(
                ['bytes32', 'address', 'uint16', 'uint256', 'uint16', 'uint256'],
                [mintTypeHash, userWallet.address, tokenId, amount, incremental, nonce]
              )
            );

            const signature = await minterWallet.signMessage(ethers.utils.arrayify(messageHash));

            await expect(userSession["mint(address,uint16,uint256,bytes,uint16,uint256)"](
              userWallet.address,
              tokenId,
              amount,
              signature,
              incremental,
              nonce,
            ))
              .to.revertedWith('Invalid Nonce');
          });

          it("using same signature", async () => {
            const [minterWallet] = await getMinterSession();
            const [userWallet, userSession] = await getUserSession();

            const tokenId = getTokenId({ accumulative: true });
            const amount = 5;
            const incremental = 1;

            const nonce = ethers.BigNumber.from(ethers.utils.hexlify(ethers.utils.randomBytes(32))).sub(1);

            const mintTypeHash = ethers.utils.keccak256(
              ethers.utils.toUtf8Bytes("Mint(address to, uint16 id, uint256 amount, uint16 incremental, uint256 nonce)")
            );

            const messageHash = ethers.utils.keccak256(
              ethers.utils.defaultAbiCoder.encode(
                ['bytes32', 'address', 'uint16', 'uint256', 'uint16', 'uint256'],
                [mintTypeHash, userWallet.address, tokenId, amount, incremental, nonce]
              )
            );

            const signature = await minterWallet.signMessage(ethers.utils.arrayify(messageHash));

            await expect(userSession["mint(address,uint16,uint256,bytes,uint16,uint256)"](
              userWallet.address,
              tokenId,
              amount,
              signature,
              incremental,
              nonce,
            ))
              .to.emit(kannaBadges, "TransferSingle")
              .withArgs(
                userWallet.address,
                ethers.constants.AddressZero,
                userWallet.address,
                tokenId,
                amount
              )
              .to.emit(kannaBadges, "Mint")
              .withArgs(
                userWallet.address,
                tokenId,
                amount,
                incremental,
              )

            await expect(userSession["mint(address,uint16,uint256,bytes,uint16,uint256)"](
              userWallet.address,
              tokenId,
              amount,
              signature,
              incremental,
              nonce,
            ))
              .to.revertedWith('Invalid Nonce');
          });
        });
      });
    });

    describe("Balance of", async () => {
      beforeEach(async () => {
        await registerTokens();
      });

      it("should get all tokens balance", async () => {
        const [, minterSession] = await getMinterSession();
        const userWallet = await getUserWallet();

        const token1Id = getTokenId({ accumulative: false });
        const token2Id = getTokenId({ accumulative: true });

        await minterSession["mint(address,uint16)"](userWallet.address, token1Id);
        await minterSession["mint(address,uint16,uint256)"](userWallet.address, token2Id, 5);

        const balances = await kannaBadges["balanceOf(address)"](userWallet.address);

        const token1Balance = balances.find(b => b.token.id === token1Id);
        const token2Balance = balances.find(b => b.token.id === token2Id);

        expect(token1Balance?.balance).eq(1);
        expect(token2Balance?.balance).eq(5);
      });

      it("should get empty array", async () => {
        const userWallet = await getUserWallet();

        const balances = await kannaBadges["balanceOf(address)"](userWallet.address);

        expect(balances.length).eq(0);
      });

      it("should get dynamic token balance", async () => {
        const deployerWallet = await getDeployerWallet();
        const [, managerSession] = await getManagerSession();
        const userWallet = await getUserWallet();

        const dynamicChecker = await getDynamicBadgeCheckerMock(deployerWallet);

        await dynamicChecker.mock.isAccumulative.returns(true);

        const tx = await managerSession["register(address)"](dynamicChecker.address);

        const event = await getTokenRegisteredEvent(tx);

        const tokenId = event.args.id;

        await dynamicChecker.mock.balanceOf.withArgs(userWallet.address, tokenId).returns(5);

        const balance = await kannaBadges["balanceOf(address,uint256)"](userWallet.address, tokenId);

        expect(balance).eq(5);
      })

      it("should prevent empty address", async () => {
        await expect(kannaBadges["balanceOf(address)"](ethers.constants.AddressZero))
          .to.revertedWith("ERC1155: address zero is not a valid owner");
      });
    });

    describe("Total supply", async () => {
      beforeEach(async () => {
        await registerTokens();
      });

      it("should return total supply", async () => {
        const [, minterSession] = await getMinterSession();
        const userWallet = await getUserWallet();
        const user2Wallet = await getUser2Wallet();

        const tokenId = getTokenId();

        await minterSession["mint(address,uint16)"](userWallet.address, tokenId);
        await minterSession["mint(address,uint16)"](user2Wallet.address, tokenId);

        const totalSupply = await kannaBadges.totalSupply(tokenId);

        expect(totalSupply).eq(2);
      });

      it("should return total supply accumulative token", async () => {
        const [, minterSession] = await getMinterSession();
        const userWallet = await getUserWallet();
        const user2Wallet = await getUser2Wallet();

        const tokenId = getTokenId({ accumulative: true });

        await minterSession["mint(address,uint16,uint256)"](userWallet.address, tokenId, 2);
        await minterSession["mint(address,uint16,uint256)"](user2Wallet.address, tokenId, 3);

        const totalSupply = await kannaBadges.totalSupply(tokenId);

        expect(totalSupply).eq(5);
      });

      it("should return empty total supply", async () => {
        const tokenId = getTokenId();

        const totalSupply = await kannaBadges.totalSupply(tokenId);

        expect(totalSupply).eq(0);
      });
    });

    describe("Transfer", async () => {
      beforeEach(async () => {
        await registerTokens();
      });

      it("should transfer if `transferable`", async () => {
        const [, minterSession] = await getMinterSession();
        const [userWallet, userSession] = await getUserSession();
        const user2Wallet = await getUser2Wallet();

        const tokenId = getTokenId({ transferable: true });
        const amount = 1;

        await minterSession["mint(address,uint16)"](userWallet.address, tokenId);

        await expect(userSession.safeTransferFrom(userWallet.address, user2Wallet.address, tokenId, amount, []))
          .to.emit(kannaBadges, "TransferSingle")
          .withArgs(
            userWallet.address,
            userWallet.address,
            user2Wallet.address,
            tokenId,
            amount
          );
      });

      it("should not transfer if not `transferable`", async () => {
        const [, minterSession] = await getMinterSession();
        const [userWallet, userSession] = await getUserSession();
        const user2Wallet = await getUser2Wallet();

        const tokenId = getTokenId({ transferable: false });
        const amount = 1;

        await minterSession["mint(address,uint16)"](userWallet.address, tokenId);

        await expect(userSession.safeTransferFrom(userWallet.address, user2Wallet.address, tokenId, amount, []))
          .to.revertedWith(`Token is not transferable`);
      });
    });

    describe("Supports interface", async () => {
      it("AccessControl interface", async () => {
        const accessControlInterface = IAccessControl__factory.createInterface();

        const interfaceId = getInterfaceID(accessControlInterface);

        const supportsInterface = await kannaBadges.supportsInterface(interfaceId);

        expect(supportsInterface).eq(true);
      });

      it("ERC1155 interface", async () => {
        const IERC165Interface = IERC165__factory.createInterface();
        const ERC1155Interface = IERC1155__factory.createInterface();

        const interfaceId = getInterfaceID(
          ERC1155Interface,
          IERC165Interface
        );

        const supportsInterface = await kannaBadges.supportsInterface(interfaceId);

        expect(supportsInterface).eq(true);
      });

      it("ERC1155 Metadata interface", async () => {
        const ERC1155Interface = IERC1155__factory.createInterface();
        const ERC1155MetadataInterface = IERC1155MetadataURI__factory.createInterface();

        const interfaceId = getInterfaceID(
          ERC1155MetadataInterface,
          ERC1155Interface,
        );

        const supportsInterface = await kannaBadges.supportsInterface(interfaceId);

        expect(supportsInterface).eq(true);
      });
    });

    describe("Bridge", async () => {
      beforeEach(async () => {
        await registerTokens();
      });

      it("should enable chain", async () => {
        const chainId = 2;

        await kannaBadges.enableBridge(chainId);

        const isEnabled = await kannaBadges.isBridgeEnabled(chainId);

        expect(isEnabled).eq(true);
      });

      it("should disable chain", async () => {
        const chainId = 2;

        await kannaBadges.enableBridge(chainId);

        await kannaBadges.disableBridge(chainId);

        const isEnabled = await kannaBadges.isBridgeEnabled(chainId);

        expect(isEnabled).eq(false);
      });

      it("should transfer to chain", async () => {
        const [, minterSession] = await getMinterSession();
        const [userWallet, userSession] = await getUserSession();

        const tokenId = getTokenId({ transferable: true });
        const chainId = 2;
        const amount = 1;

        await minterSession["mint(address,uint16)"](userWallet.address, tokenId);

        await kannaBadges.enableBridge(chainId);

        await expect(userSession.transferToChain(tokenId, chainId, amount))
          .to.emit(kannaBadges, "BridgeTransfer")
          .withArgs(
            userWallet.address,
            tokenId,
            amount,
            chainId
          )
      });

      describe("should not transfer", async () => {
        it("token not registered", async () => {
          const [, userSession] = await getUserSession();

          const tokenId = 99;
          const chainId = 2;
          const amount = 1;

          await expect(userSession.transferToChain(tokenId, chainId, amount))
            .to.be.revertedWith("Invalid Token");
        });

        it("amount lower than one", async () => {
          const [, userSession] = await getUserSession();

          const tokenId = getTokenId();
          const chainId = 2;
          const amount = 0;

          await expect(userSession.transferToChain(tokenId, chainId, amount))
            .to.be.revertedWith("Invalid amount");
        });

        it("insuficient balance", async () => {
          const [, userSession] = await getUserSession();

          const tokenId = getTokenId();
          const chainId = 2;
          const amount = 1;

          await expect(userSession.transferToChain(tokenId, chainId, amount))
            .to.be.revertedWith("Insuficient balance");
        });

        it("invalid chain id", async () => {
          const [, minterSession] = await getMinterSession();
          const [userWallet, userSession] = await getUserSession();

          const tokenId = getTokenId();
          const chainId = 2;
          const amount = 1;

          await minterSession["mint(address,uint16)"](userWallet.address, 1);

          await expect(userSession.transferToChain(tokenId, chainId, amount))
            .to.be.revertedWith("Invalid chain");
        });

        it("dynamic token", async () => {
          const deployerWallet = await getDeployerWallet();
          const [, managerSession] = await getManagerSession();
          const [userWallet, userSession] = await getUserSession();

          const chainId = 2;
          const amount = 1;

          await kannaBadges.enableBridge(chainId);

          const dynamicChecker = await getDynamicBadgeCheckerMock(deployerWallet);

          await dynamicChecker.mock.isAccumulative.returns(true);

          const tx = await managerSession["register(address)"](dynamicChecker.address);
          const event = await getTokenRegisteredEvent(tx);
          const tokenId = event.args.id;

          await dynamicChecker.mock.balanceOf.withArgs(userWallet.address, tokenId).returns(1);

          await expect(userSession.transferToChain(tokenId, chainId, amount))
            .to.be.revertedWith("Token is not transferable");
        });
      });
    });

    describe("should prevent not owner", () => {
      const revertWith = "Ownable: caller is not the owner";

      it("set URI", async () => {
        const [, userSession] = await getUserSession();

        await expect(userSession.setURI('https://new-uri/{id}'))
          .to.revertedWith(revertWith)
      });

      it("add manager", async () => {
        const [, userSession] = await getUserSession();
        const [user2Wallet] = await getUser2Session();

        await expect(userSession.addManager(user2Wallet.address))
          .to.be.revertedWith(revertWith);
      });

      it("remove manager", async () => {
        const [, userSession] = await getUserSession();
        const [user2Wallet] = await getUser2Session();

        await expect(userSession.removeManager(user2Wallet.address))
          .to.be.revertedWith(revertWith);
      });

      it("add minter", async () => {
        const [, userSession] = await getUserSession();
        const [user2Wallet] = await getUser2Session();

        await expect(userSession.addMinter(user2Wallet.address))
          .to.be.revertedWith(revertWith);
      });

      it("remove minter", async () => {
        const [, userSession] = await getUserSession();
        const [user2Wallet] = await getUser2Session();

        await expect(userSession.removeMinter(user2Wallet.address))
          .to.be.revertedWith(revertWith);
      });

      it("enable bridge chain", async () => {
        const [, userSession] = await getUserSession();

        await expect(userSession.enableBridge(2))
          .to.be.revertedWith(revertWith);
      });

      it("disable bridge chain", async () => {
        const [, userSession] = await getUserSession();

        await expect(userSession.disableBridge(2))
          .to.be.revertedWith(revertWith);
      });
    });
  });
});