import { ethers, network } from "hardhat";
import { utils } from "ethers";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { KannaBadges, IAccessControl__factory, IERC1155__factory, IERC1155MetadataURI__factory, IERC165__factory } from "../../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { getKannaBadges } from "../../src/infrastructure/factories";

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

const tokens = [
  { id: 2, transferable: false, accumulative: false },
  { id: 3, transferable: true, accumulative: true },
  { id: 4, transferable: true, accumulative: false },
  { id: 5, transferable: false, accumulative: true },
];

describe("Kanna Badges", () => {
  let signers: SignerWithAddress[];
  let kannaBadges: KannaBadges;

  const deployContracts = async () => {
    signers = await ethers.getSigners();

    const [deployerWallet] = signers;

    kannaBadges = await getKannaBadges(deployerWallet);
  };

  const getDeployerWallet = async () => {
    const [deployerWallet] = signers;

    return deployerWallet;
  };

  const getMinterSession = async (): Promise<
    [SignerWithAddress, KannaBadges]
  > => {
    const [, minterWallet] = signers;

    await kannaBadges.addMinter(minterWallet.address);

    const minterSession = (await ethers.getContractAt(
      "KannaBadges",
      kannaBadges.address,
      minterWallet
    )) as KannaBadges;

    return [minterWallet, minterSession];
  };

  const getUserWallet = async () => {
    const [, , userAccount] = signers;

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
    const [, , , userAccount] = signers;

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

  describe("Setup", async () => {
    beforeEach(async () => {
      await deployContracts();
    });

    describe("Register Token", async () => {
      it("should register token", async () => {
        for await (const token of tokens) {
          await expect(kannaBadges.register(token.id, token.transferable, token.accumulative))
            .to.emit(kannaBadges, "TokenRegistered")
            .withArgs(
              token.id,
              token.transferable,
              token.accumulative
            );
        }
      });

      it("should not register `id` already registered", async () => {
        await expect(kannaBadges.register(1, false, false))
          .to.emit(kannaBadges, "TokenRegistered")
          .withArgs(
            1,
            false,
            false
          );

        await expect(kannaBadges.register(1, false, false))
          .to.revertedWith("Token already exists")
      });
    });

    describe("Set URI", async () => {
      it("should set new URI", async () => {
        const uri = 'https://new-uri/{id}';

        await kannaBadges.setURI(uri);

        const newUri = await kannaBadges.uri(1);

        expect(newUri).to.eq(uri);
      });

      it("should emit URI event for each registered Token", async () => {
        const uri = 'https://new-uri/{id}';

        for await (const token of tokens) {
          await kannaBadges.register(token.id, token.transferable, token.accumulative);
        }

        const tx = kannaBadges.setURI(uri);

        for await (const token of tokens) {
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
        for await (const token of tokens) {
          await kannaBadges.register(token.id, token.transferable, token.accumulative);
        }
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
        const [minterWallet, minterSession] = await getMinterSession();

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

        const tokenId = 2;

        await expect(minterSession["mint(address,uint256)"](userWallet.address, tokenId))
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

        expect(balance).to.eq(1);
      });

      it("should mint with amount", async () => {
        const [minterWallet, minterSession] = await getMinterSession();
        const userWallet = await getUserWallet();

        const tokenId = 3;
        const amount = 5;

        await expect(minterSession["mint(address,uint256,uint256)"](userWallet.address, tokenId, amount))
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

        expect(balance).to.eq(amount);
      });

      it("should batch mint", async () => {
        const [minterWallet, minterSession] = await getMinterSession();
        const userWallet = await getUserWallet();
        const user2Wallet = await getUser2Wallet();

        const tokenId = 2;

        await expect(minterSession.batchMint(tokenId, [
          userWallet.address,
          user2Wallet.address,
        ]))
          .to.emit(kannaBadges, "TransferSingle")
          .withArgs(
            minterWallet.address,
            ethers.constants.AddressZero,
            userWallet.address,
            tokenId,
            1
          )
          .to.emit(kannaBadges, "TransferSingle")
          .withArgs(
            minterWallet.address,
            ethers.constants.AddressZero,
            user2Wallet.address,
            tokenId,
            1
          )
          .to.emit(kannaBadges, "Mint")
          .withArgs(
            userWallet.address,
            tokenId,
            1,
            1
          )
          .to.emit(kannaBadges, "Mint")
          .withArgs(
            user2Wallet.address,
            tokenId,
            1,
            1
          );

        const balance = await kannaBadges["balanceOf(address,uint256)"](userWallet.address, tokenId);

        expect(balance).to.eq(1);

        const balance2 = await kannaBadges["balanceOf(address,uint256)"](user2Wallet.address, tokenId);

        expect(balance2).to.eq(1);
      });

      it("should mint with signature", async () => {
        const [minterWallet] = await getMinterSession();
        const [userWallet, userSession] = await getUserSession();

        const tokenId = 3;
        const amount = 5;
        const incremental = 1;

        const nonce = ethers.BigNumber.from(ethers.utils.hexlify(ethers.utils.randomBytes(32))).sub(1);

        const mintTypeHash = ethers.utils.keccak256(
          ethers.utils.toUtf8Bytes("Mint(address to, uint256 id, uint256 amount, uint256 nonce, uint256 incremental)")
        );

        const messageHash = ethers.utils.keccak256(
          ethers.utils.defaultAbiCoder.encode(
            ['bytes32', 'address', 'uint256', 'uint256', 'uint256', 'uint256'],
            [mintTypeHash, userWallet.address, tokenId, amount, nonce, incremental]
          )
        );

        const signature = await minterWallet.signMessage(ethers.utils.arrayify(messageHash));

        await expect(userSession["mint(address,uint256,uint256,bytes,uint256,uint256)"](
          userWallet.address,
          tokenId,
          amount,
          signature,
          nonce,
          incremental
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
          );

        const balance = await kannaBadges["balanceOf(address,uint256)"](userWallet.address, tokenId);

        expect(balance).to.eq(amount);
      });

      it("should increase mint nonce", async () => {
        const [minterWallet, minterSession] = await getMinterSession();
        const userWallet = await getUserWallet();

        const tokenId = 3;

        for (let i = 1; i < 5; i++) {
          await expect(minterSession["mint(address,uint256)"](userWallet.address, tokenId))
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
              i
            );
        }
      });

      describe("should not", async () => {
        describe("without MINTER_ROLE", async () => {
          it("mint", async () => {
            const [, userSession] = await getUserSession();
            const user2Wallet = await getUser2Wallet();

            await expect(userSession["mint(address,uint256)"](user2Wallet.address, 2))
              .to.reverted;
          });

          it("mint with amount", async () => {
            const [, userSession] = await getUserSession();
            const user2Wallet = await getUser2Wallet();

            await expect(userSession["mint(address,uint256,uint256)"](user2Wallet.address, 3, 5))
              .to.reverted;
          });

          it("batch mint", async () => {
            const [, userSession] = await getUserSession();
            const user2Wallet = await getUser2Wallet();

            await expect(userSession.batchMint(2, [user2Wallet.address]))
              .to.reverted;
          });

          it("mint with signature", async () => {
            const [userWallet, userSession] = await getUserSession();
            const user2Wallet = await getUser2Wallet();

            const tokenId = 3;
            const amount = 5;
            const incremental = 1;

            const nonce = ethers.BigNumber.from(ethers.utils.hexlify(ethers.utils.randomBytes(32))).sub(1);

            const mintTypeHash = ethers.utils.keccak256(
              ethers.utils.toUtf8Bytes("Mint(address to, uint256 id, uint256 amount, uint256 nonce, uint256 incremental)")
            );

            const messageHash = ethers.utils.keccak256(
              ethers.utils.defaultAbiCoder.encode(
                ['bytes32', 'address', 'uint256', 'uint256', 'uint256', 'uint256'],
                [mintTypeHash, user2Wallet.address, tokenId, amount, nonce, incremental]
              )
            );

            const signature = await userWallet.signMessage(ethers.utils.arrayify(messageHash));

            await expect(userSession["mint(address,uint256,uint256,bytes,uint256,uint256)"](
              user2Wallet.address,
              tokenId,
              amount,
              signature,
              nonce,
              incremental
            )).to.reverted;
          });
        });

        describe("token not registered", async () => {
          it("mint", async () => {
            const [, minterSession] = await getMinterSession();
            const userWallet = await getUserWallet();

            const tokenId = 99;

            await expect(minterSession["mint(address,uint256)"](userWallet.address, tokenId))
              .to.revertedWith('Invalid Token');
          });

          it("mint with amount", async () => {
            const [, minterSession] = await getMinterSession();
            const userWallet = await getUserWallet();

            const tokenId = 99;
            const amount = 5;

            await expect(minterSession["mint(address,uint256,uint256)"](userWallet.address, tokenId, amount))
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
              ethers.utils.toUtf8Bytes("Mint(address to, uint256 id, uint256 amount, uint256 nonce, uint256 incremental)")
            );

            const messageHash = ethers.utils.keccak256(
              ethers.utils.defaultAbiCoder.encode(
                ['bytes32', 'address', 'uint256', 'uint256', 'uint256', 'uint256'],
                [mintTypeHash, userWallet.address, tokenId, amount, nonce, incremental]
              )
            );

            const signature = await minterWallet.signMessage(ethers.utils.arrayify(messageHash));

            await expect(userSession["mint(address,uint256,uint256,bytes,uint256,uint256)"](
              userWallet.address,
              tokenId,
              amount,
              signature,
              nonce,
              incremental
            ))
              .to.revertedWith('Invalid Token');
          });
        });

        describe("mint not `accumulative` token", async () => {
          it("more than once", async () => {
            const [, minterSession] = await getMinterSession();
            const userWallet = await getUserWallet();

            const tokenId = 2;

            await minterSession["mint(address,uint256)"](userWallet.address, tokenId);

            await expect(minterSession["mint(address,uint256)"](userWallet.address, tokenId))
              .to.revertedWith(`Token ${tokenId} is not accumulative`);
          });

          it("amount greater than 1", async () => {
            const [, minterSession] = await getMinterSession();
            const userWallet = await getUserWallet();

            const tokenId = 2;

            await expect(minterSession["mint(address,uint256,uint256)"](userWallet.address, tokenId, 2))
              .to.revertedWith(`Token ${tokenId} is not accumulative`);
          });
        });

        describe("invalid incremental mint nonce", () => {
          it("wrong nonce", async () => {
            const [minterWallet] = await getMinterSession();
            const [userWallet, userSession] = await getUserSession();

            const tokenId = 3;
            const amount = 5;
            const incremental = 2;

            const nonce = ethers.BigNumber.from(ethers.utils.hexlify(ethers.utils.randomBytes(32))).sub(1);

            const mintTypeHash = ethers.utils.keccak256(
              ethers.utils.toUtf8Bytes("Mint(address to, uint256 id, uint256 amount, uint256 nonce, uint256 incremental)")
            );

            const messageHash = ethers.utils.keccak256(
              ethers.utils.defaultAbiCoder.encode(
                ['bytes32', 'address', 'uint256', 'uint256', 'uint256', 'uint256'],
                [mintTypeHash, userWallet.address, tokenId, amount, nonce, incremental]
              )
            );

            const signature = await minterWallet.signMessage(ethers.utils.arrayify(messageHash));

            await expect(userSession["mint(address,uint256,uint256,bytes,uint256,uint256)"](
              userWallet.address,
              tokenId,
              amount,
              signature,
              nonce,
              incremental
            ))
              .to.revertedWith('Invalid Nonce');
          });

          it("using same signature", async () => {
            const [minterWallet] = await getMinterSession();
            const [userWallet, userSession] = await getUserSession();

            const tokenId = 3;
            const amount = 5;
            const incremental = 1;

            const nonce = ethers.BigNumber.from(ethers.utils.hexlify(ethers.utils.randomBytes(32))).sub(1);

            const mintTypeHash = ethers.utils.keccak256(
              ethers.utils.toUtf8Bytes("Mint(address to, uint256 id, uint256 amount, uint256 nonce, uint256 incremental)")
            );

            const messageHash = ethers.utils.keccak256(
              ethers.utils.defaultAbiCoder.encode(
                ['bytes32', 'address', 'uint256', 'uint256', 'uint256', 'uint256'],
                [mintTypeHash, userWallet.address, tokenId, amount, nonce, incremental]
              )
            );

            const signature = await minterWallet.signMessage(ethers.utils.arrayify(messageHash));

            await expect(userSession["mint(address,uint256,uint256,bytes,uint256,uint256)"](
              userWallet.address,
              tokenId,
              amount,
              signature,
              nonce,
              incremental
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

            await expect(userSession["mint(address,uint256,uint256,bytes,uint256,uint256)"](
              userWallet.address,
              tokenId,
              amount,
              signature,
              nonce,
              incremental
            ))
              .to.revertedWith('Invalid Nonce');
          });
        });
      });
    });

    describe("Balance of", async () => {
      beforeEach(async () => {
        for await (const token of tokens) {
          await kannaBadges.register(token.id, token.transferable, token.accumulative);
        }
      });

      it("should get all tokens balance", async () => {
        const [, minterSession] = await getMinterSession();
        const userWallet = await getUserWallet();

        await minterSession["mint(address,uint256)"](userWallet.address, 2);
        await minterSession["mint(address,uint256,uint256)"](userWallet.address, 3, 5);

        const balances = await kannaBadges["balanceOf(address)"](userWallet.address);

        const token2Balance = balances.find(b => b.token.id.eq(2));
        const token3Balance = balances.find(b => b.token.id.eq(3));

        expect(token2Balance?.balance).to.eq(1);
        expect(token3Balance?.balance).to.eq(5);
      });

      it("should get empty array", async () => {
        const userWallet = await getUserWallet();

        const balances = await kannaBadges["balanceOf(address)"](userWallet.address);

        expect(balances.length).to.eq(0);
      });

      it("should prevent empty address", async () => {
        await expect(kannaBadges["balanceOf(address)"](ethers.constants.AddressZero))
          .to.revertedWith("ERC1155: address zero is not a valid owner");
      });
    });

    describe("Transfer", async () => {
      beforeEach(async () => {
        for await (const token of tokens) {
          await kannaBadges.register(token.id, token.transferable, token.accumulative);
        }
      });

      it("should transfer if `transferable`", async () => {
        const [, minterSession] = await getMinterSession();
        const [userWallet, userSession] = await getUserSession();
        const user2Wallet = await getUser2Wallet();

        const tokenId = 3;
        const amount = 1;

        await minterSession["mint(address,uint256)"](userWallet.address, tokenId);

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

        const tokenId = 2;
        const amount = 1;

        await minterSession["mint(address,uint256)"](userWallet.address, tokenId);

        await expect(userSession.safeTransferFrom(userWallet.address, user2Wallet.address, tokenId, amount, []))
          .to.revertedWith(`Token ${tokenId} is not transferable`);
      });
    });

    describe("Supports interface", async () => {
      it("AccessControl interface", async () => {
        const accessControlInterface = IAccessControl__factory.createInterface();

        const interfaceId = getInterfaceID(accessControlInterface);

        const supportsInterface = await kannaBadges.supportsInterface(interfaceId);

        expect(supportsInterface).to.eq(true);
      });

      it("ERC1155 interface", async () => {
        const IERC165Interface = IERC165__factory.createInterface();
        const ERC1155Interface = IERC1155__factory.createInterface();

        const interfaceId = getInterfaceID(
          ERC1155Interface,
          IERC165Interface
        );

        const supportsInterface = await kannaBadges.supportsInterface(interfaceId);

        expect(supportsInterface).to.eq(true);
      });

      it("ERC1155 Metadata interface", async () => {
        const ERC1155Interface = IERC1155__factory.createInterface();
        const ERC1155MetadataInterface = IERC1155MetadataURI__factory.createInterface();

        const interfaceId = getInterfaceID(
          ERC1155MetadataInterface,
          ERC1155Interface,
        );

        const supportsInterface = await kannaBadges.supportsInterface(interfaceId);

        expect(supportsInterface).to.eq(true);
      });
    });

    describe("should prevent not owner", () => {
      const revertWith = "Ownable: caller is not the owner";

      it("register", async () => {
        const [, userSession] = await getUserSession();

        await expect(userSession.register(1, false, false))
          .to.revertedWith(revertWith)
      });

      it("set URI", async () => {
        const [, userSession] = await getUserSession();

        await expect(userSession.setURI('https://new-uri/{id}'))
          .to.revertedWith(revertWith)
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
    });
  });
});