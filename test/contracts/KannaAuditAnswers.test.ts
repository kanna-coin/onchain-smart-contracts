import { ethers } from 'hardhat';
import { Signer, constants, utils } from 'ethers';
import { v4 as uuidv4 } from 'uuid';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { MockContract } from 'ethereum-waffle';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { KannaAuditAnswers, IKannaAuditScoreProvider__factory, IAccessControl__factory, IERC165__factory } from '../../typechain-types';
import { getKannaAuditAnswers, getKannaAuditStakePoolMock } from '../../src/infrastructure/factories';


chai.use(chaiAsPromised);
const { expect } = chai;

const getInterfaceID = (contractInterface: utils.Interface, ...excludeInterfaces: utils.Interface[]) => {
  const interfaceFunctions = excludeInterfaces
    .flatMap(contractInterface => Object.keys(contractInterface.functions));

  let interfaceID = ethers.constants.Zero;

  const functions = Object.keys(contractInterface.functions)
    .filter(functionName => !interfaceFunctions.includes(functionName));

  for (let i = 0; i < functions.length; i++) {
    interfaceID = interfaceID.xor(contractInterface.getSighash(functions[i]));
  }

  return interfaceID._hex.padEnd(10, '0');
};

describe('KannaAuditAnswers', () => {
  let signers: SignerWithAddress[];
  let auditAnswers: KannaAuditAnswers;
  let stakePool: MockContract;

  const deployContracts = async () => {
    signers = await ethers.getSigners();

    const [deployerWallet] = signers;

    stakePool = await getKannaAuditStakePoolMock(deployerWallet);
    auditAnswers = await getKannaAuditAnswers(deployerWallet, stakePool.address);
  };

  const getSession = async (signer: Signer, auditAnswersContract: KannaAuditAnswers = auditAnswers) => {
    const session = (await ethers.getContractAt(
      'KannaAuditAnswers',
      auditAnswersContract.address,
      signer
    )) as KannaAuditAnswers;

    return session;
  };

  const getOwnerSession = async (auditAnswersContract: KannaAuditAnswers = auditAnswers) => {
    const [deployerWallet] = signers;

    const session = await getSession(deployerWallet, auditAnswersContract);

    return [session, deployerWallet] as const;
  };

  const getUserSession = async (auditAnswersContract: KannaAuditAnswers = auditAnswers) => {
    const [, , userWallet] = signers;

    const session = await getSession(userWallet, auditAnswersContract);

    return [session, userWallet] as const;
  };

  const getUser2Wallet = async () => {
    const [, , , , userAccount] = signers;

    return userAccount;
  };

  const getUser3Wallet = async () => {
    const [, , , , , userAccount] = signers;

    return userAccount;
  };

  const getUser4Wallet = async () => {
    const [, , , , , userAccount] = signers;

    return userAccount;
  };

  describe("Setup", async () => {
    beforeEach(async () => {
      await deployContracts();
    });

    describe("Deploy", async () => {
      it('should not deploy with zero address', async () => {
        const [deployerWallet] = signers;

        await expect(
          getKannaAuditAnswers(deployerWallet, constants.AddressZero)
        ).to.be.revertedWith('Stake pool address cannot be zero');
      });
    });

    describe('Support interface', () => {
      it('should support IKannaAuditScoreProvider interface', async () => {
        const [ownerSession] = await getOwnerSession();

        const supportedsInterface = IKannaAuditScoreProvider__factory.createInterface();
        const ierc165Interface = IERC165__factory.createInterface();

        const interfaceId = getInterfaceID(supportedsInterface, ierc165Interface);

        const isSupported = await ownerSession.supportsInterface(interfaceId);

        expect(isSupported).to.be.true;
      });

      it('should support IERC165 interface', async () => {
        const [ownerSession] = await getOwnerSession();

        const supportedsInterface = IERC165__factory.createInterface();

        const interfaceId = getInterfaceID(supportedsInterface);

        const isSupported = await ownerSession.supportsInterface(interfaceId);

        expect(isSupported).to.be.true;
      });

      it('should not support unknown interface', async () => {
        const [ownerSession] = await getOwnerSession();

        const isSupported = await ownerSession.supportsInterface('0x00000000');

        expect(isSupported).to.be.false;
      });
    });

    describe('Register question', async () => {
      it('should register question', async () => {
        const [ownerSession] = await getOwnerSession();

        const questionId = uuidv4();
        const questionIdBytes = utils.keccak256(utils.toUtf8Bytes(questionId));
        const points = 10;
        const options: string[] = [];

        const tx = await ownerSession.registerQuestion(questionId, points, options);

        const blockTimestamp = (await ethers.provider.getBlock('latest')).timestamp;

        await expect(tx)
          .to.emit(ownerSession, 'QuestionRegistered')
          .withArgs(questionIdBytes, points, blockTimestamp);

        const questionPoints = await ownerSession['getQuestionPoints(bytes32)'](questionIdBytes);

        expect(questionPoints).to.eq(points);
      });

      it('should register question with options', async () => {
        const [ownerSession] = await getOwnerSession();

        const questionId = uuidv4();
        const questionIdBytes = utils.keccak256(utils.toUtf8Bytes(questionId));
        const points = 10;
        const options: string[] = ['option 1', 'option 2', 'option 3'];

        const tx = await ownerSession.registerQuestion(questionId, points, options);

        const blockTimestamp = (await ethers.provider.getBlock('latest')).timestamp;

        await expect(tx)
          .to.emit(ownerSession, 'QuestionRegistered')
          .withArgs(questionIdBytes, points, blockTimestamp);

        const questionPoints = await ownerSession['getQuestionPoints(string)'](questionId);

        expect(questionPoints).to.eq(points);
      });

      it('should register multiple questions', async () => {
        const [ownerSession] = await getOwnerSession();

        const questionIds = [uuidv4(), uuidv4(), uuidv4()];
        const questionPoints = [10, 20, 30];
        const options: string[][] = [[], ['a', 'b', 'c'], []];

        const tx = await ownerSession.registerQuestions(questionIds, questionPoints, options);

        const blockTimestamp = (await ethers.provider.getBlock('latest')).timestamp;

        for (let i = 0; i < questionIds.length; i++) {
          const questionIdBytes = utils.keccak256(utils.toUtf8Bytes(questionIds[i]));
          const points = questionPoints[i];

          await expect(tx)
            .to.emit(ownerSession, 'QuestionRegistered')
            .withArgs(questionIdBytes, points, blockTimestamp);
        }
      });

      it('should increase total points', async () => {
        const questionIds = [uuidv4(), uuidv4(), uuidv4()];
        const questionPoints = [10, 20, 30];
        const options = [['a', 'b', 'c'], [], []];

        const [ownerSession] = await getOwnerSession();

        await ownerSession.registerQuestions(questionIds, questionPoints, options);

        const totalPoints = await ownerSession.totalPoints();

        expect(totalPoints).to.eq(60);
      });

      it('should increase return question ids', async () => {
        const questionIds = [uuidv4(), uuidv4(), uuidv4()];
        const questionPoints = [10, 20, 30];
        const options = [['a', 'b', 'c'], [], []];

        const [ownerSession] = await getOwnerSession();

        await ownerSession.registerQuestions(questionIds, questionPoints, options);

        const registeredQuestions = await ownerSession.getQuestionIds();
        const questionIdsBytes = questionIds.map(questionId => utils.keccak256(utils.toUtf8Bytes(questionId)));

        expect(registeredQuestions).to.have.members(questionIdsBytes);
      });

      describe('should not', () => {
        it('uuid is not 36 characters long', async () => {
          const [ownerSession] = await getOwnerSession();

          const questionId = uuidv4() + 'a';
          const points = 10;
          const options: string[] = [];

          await expect(ownerSession.registerQuestion(questionId, points, options))
            .to.be.revertedWith("UUID must be 36 characters long");
        });

        it('register question already registered', async () => {
          const [ownerSession] = await getOwnerSession();

          const questionId = uuidv4();
          const points = 10;
          const options: string[] = [];

          await ownerSession.registerQuestion(questionId, points, options);

          await expect(ownerSession.registerQuestion(questionId, points, options))
            .to.be.revertedWith("Question already registered");
        });

        it('register empty questions', async () => {
          const [ownerSession] = await getOwnerSession();

          const questionIds: string[] = [];
          const questionPoints: number[] = [];
          const options: string[][] = [];

          await expect(ownerSession.registerQuestions(questionIds, questionPoints, options))
            .to.be.revertedWith("Questions cannot be empty");
        });

        it('register multiple questions if points not same length', async () => {
          const [ownerSession] = await getOwnerSession();

          const questionIds = [uuidv4(), uuidv4(), uuidv4()];
          const questionPoints = [10, 20];
          const options: string[][] = [[], [], []];

          await expect(ownerSession.registerQuestions(questionIds, questionPoints, options))
            .to.be.revertedWith("Questions and points length mismatch");
        });

        it('register multiple questions if options not same length', async () => {
          const [ownerSession] = await getOwnerSession();

          const questionIds = [uuidv4(), uuidv4(), uuidv4()];
          const questionPoints = [10, 20, 30];
          const options: string[][] = [[], []];

          await expect(ownerSession.registerQuestions(questionIds, questionPoints, options))
            .to.be.revertedWith("Questions and options length mismatch");
        });

        it('register question when not owner', async () => {
          const [userSession] = await getUserSession();

          const questionId = uuidv4();
          const points = 10;
          const options: string[] = [];

          await expect(userSession.registerQuestion(questionId, points, options))
            .to.be.revertedWith('Ownable: caller is not the owner');
        });

        it('register multiple questions when not owner', async () => {
          const [userSession] = await getUserSession();

          const questionIds = [uuidv4(), uuidv4(), uuidv4()];
          const questionPoints = [10, 20, 30];
          const options: string[][] = [[], [], []];

          await expect(userSession.registerQuestions(questionIds, questionPoints, options))
            .to.be.revertedWith('Ownable: caller is not the owner');
        });

        it('register question when not active', async () => {
          const [ownerSession] = await getOwnerSession();

          await ownerSession.finalize();

          const questionId = uuidv4();
          const points = 10;
          const options: string[] = [];

          await expect(ownerSession.registerQuestion(questionId, points, options))
            .to.be.revertedWith('Contract is not active');
        });

        it('register multiple questions when not active', async () => {
          const [ownerSession] = await getOwnerSession();

          await ownerSession.finalize();

          const questionIds = [uuidv4(), uuidv4(), uuidv4()];
          const questionPoints = [10, 20, 30];
          const options: string[][] = [[], [], []];

          await expect(ownerSession.registerQuestions(questionIds, questionPoints, options))
            .to.be.revertedWith('Contract is not active');
        });
      });
    });

    describe('Set answer keys', async () => {
      const questionIds = [uuidv4(), uuidv4(), uuidv4()];
      const questionPoints = [10, 20, 30];
      const options = [['a', 'b', 'c'], [], []];

      beforeEach(async () => {
        const [ownerSession] = await getOwnerSession();

        await ownerSession.registerQuestions(questionIds, questionPoints, options);
      });

      it('should set answer key', async () => {
        const [ownerSession] = await getOwnerSession();

        const questionId = questionIds[0];
        const questionIdBytes = utils.keccak256(utils.toUtf8Bytes(questionId));
        const answerKey = 'a';
        const alternatives: string[] = [];

        const tx = await ownerSession.setAnswerKey(questionId, answerKey, alternatives);

        const blockTimestamp = (await ethers.provider.getBlock('latest')).timestamp;

        await expect(tx)
          .to.emit(ownerSession, 'AnswerKeySet')
          .withArgs(questionIdBytes, blockTimestamp);
      });

      it('should set answer key with alternative', async () => {
        const [ownerSession] = await getOwnerSession();

        const questionId = questionIds[0];
        const questionIdBytes = utils.keccak256(utils.toUtf8Bytes(questionId));
        const answerKey = 'a';
        const alternatives: string[] = ['b'];

        const tx = await ownerSession.setAnswerKey(questionId, answerKey, alternatives);

        const blockTimestamp = (await ethers.provider.getBlock('latest')).timestamp;

        await expect(tx)
          .to.emit(ownerSession, 'AnswerKeySet')
          .withArgs(questionIdBytes, blockTimestamp);
      });

      it('should set answer key with alternatives', async () => {
        const [ownerSession] = await getOwnerSession();

        const questionId = questionIds[1];
        const questionIdBytes = utils.keccak256(utils.toUtf8Bytes(questionId));
        const answerKey = 'answerKey';
        const alternatives: string[] = [
          'alternative 1',
          'alternative 2',
          'alternative 3',
          'alternative 4',
        ];

        const tx = await ownerSession.setAnswerKey(questionId, answerKey, alternatives);

        const blockTimestamp = (await ethers.provider.getBlock('latest')).timestamp;

        await expect(tx)
          .to.emit(ownerSession, 'AnswerKeySet')
          .withArgs(questionIdBytes, blockTimestamp);
      });

      describe('should not', () => {
        it('set empty answer key', async () => {
          const [ownerSession] = await getOwnerSession();

          const questionId = questionIds[1];
          const answerKey = '';
          const alternatives: string[] = [];

          await expect(ownerSession.setAnswerKey(questionId, answerKey, alternatives))
            .to.be.revertedWith("Answer key connot be empty");
        });

        it('set empty alternative', async () => {
          const [ownerSession] = await getOwnerSession();

          const questionId = questionIds[1];
          const answerKey = 'answerKey';
          const alternatives: string[] = [''];

          await expect(ownerSession.setAnswerKey(questionId, answerKey, alternatives))
            .to.be.revertedWith("Alternarive key connot be empty");
        });

        it('set answer key not present in options', async () => {
          const [ownerSession] = await getOwnerSession();

          const questionId = questionIds[0];
          const answerKey = 'd';
          const alternatives: string[] = [];

          await expect(ownerSession.setAnswerKey(questionId, answerKey, alternatives))
            .to.be.revertedWith("Answer key must be one of the options");
        });

        it('add alternatives not present in options', async () => {
          const [ownerSession] = await getOwnerSession();

          const questionId = questionIds[0];
          const answerKey = 'a';
          const alternatives: string[] = ['d'];

          await expect(ownerSession.setAnswerKey(questionId, answerKey, alternatives))
            .to.be.revertedWith("Alternative must be one of the options");
        });

        it('if question not registered', async () => {
          const [ownerSession] = await getOwnerSession();

          const questionId = uuidv4();
          const answerKey = 'answerKey';
          const alternatives: string[] = [];

          await expect(ownerSession.setAnswerKey(questionId, answerKey, alternatives))
            .to.be.revertedWith("Question not registered");
        });

        it('when not owner', async () => {
          const [userSession] = await getUserSession();

          const questionId = uuidv4();
          const answerKey = 'answerKey';
          const alternatives: string[] = [];

          await expect(userSession.setAnswerKey(questionId, answerKey, alternatives))
            .to.be.revertedWith('Ownable: caller is not the owner');
        });

        it('when not active', async () => {
          const [ownerSession] = await getOwnerSession();

          await ownerSession.finalize();

          const questionId = uuidv4();
          const answerKey = 'answerKey';
          const alternatives: string[] = [];

          await expect(ownerSession.setAnswerKey(questionId, answerKey, alternatives))
            .to.be.revertedWith('Contract is not active');
        });
      });
    });

    describe('Set Answer', async () => {
      const questionIds = [uuidv4(), uuidv4(), uuidv4()];
      const questionPoints = [10, 20, 30];
      const options = [['a', 'b', 'c'], [], []];

      beforeEach(async () => {
        const [ownerSession] = await getOwnerSession();

        await ownerSession.registerQuestions(questionIds, questionPoints, options);
      });

      describe('Owner session', () => {
        it('shoud set single answer', async () => {
          const [ownerSession] = await getOwnerSession();
          const [, userWallet] = await getUserSession();

          await stakePool.mock.isStaked.withArgs(userWallet.address).returns(true);

          const tx = await ownerSession.setWalletAnswer(userWallet.address, questionIds[1], 'answer');

          const questionIdBytes = utils.keccak256(utils.toUtf8Bytes(questionIds[1]));
          const blockTimestamp = (await ethers.provider.getBlock('latest')).timestamp;

          await expect(tx)
            .to.emit(ownerSession, 'AnswerSet')
            .withArgs(userWallet.address, questionIdBytes, blockTimestamp);
        });

        it('shoud set multiple answers', async () => {
          const [ownerSession] = await getOwnerSession();
          const [, userWallet] = await getUserSession();

          await stakePool.mock.isStaked.withArgs(userWallet.address).returns(true);

          const questions = [questionIds[0], questionIds[1]];
          const answers = ['a', 'b'];

          const tx = await ownerSession.setWalletAnswers(userWallet.address, questions, answers);

          const blockTimestamp = (await ethers.provider.getBlock('latest')).timestamp;

          for (const questionId of questions) {
            const questionIdBytes = utils.keccak256(utils.toUtf8Bytes(questionId));

            await expect(tx)
              .to.emit(ownerSession, 'AnswerSet')
              .withArgs(userWallet.address, questionIdBytes, blockTimestamp);
          }

          const walletAnswers = await ownerSession.getWalletAnswers(userWallet.address);

          expect(walletAnswers).to.have.length(2);
        });

        it('should return question wallets', async () => {
          const [ownerSession] = await getOwnerSession();
          const [, userWallet] = await getUserSession();
          const user2Wallet = await getUser2Wallet();

          await stakePool.mock.isStaked.withArgs(userWallet.address).returns(true);
          await stakePool.mock.isStaked.withArgs(user2Wallet.address).returns(true);

          await ownerSession.setWalletAnswers(userWallet.address, [questionIds[0], questionIds[1]], ['a', 'b']);
          await ownerSession.setWalletAnswers(user2Wallet.address, [questionIds[1], questionIds[2]], ['a', 'b']);

          const contractQuestionIds = await ownerSession.getQuestionIds();

          const expectedWallets = [
            [userWallet.address],
            [userWallet.address, user2Wallet.address],
            [user2Wallet.address],
          ];

          for (let i = 0; i < contractQuestionIds.length; i++) {
            const wallets = await ownerSession['getQuestionWallets(bytes32)'](contractQuestionIds[i]);

            expect(wallets).to.have.members(expectedWallets[i]);
          }

          for (let i = 0; i < questionIds.length; i++) {
            const wallets = await ownerSession['getQuestionWallets(string)'](questionIds[i]);

            expect(wallets).to.have.members(expectedWallets[i]);
          }

          const walletAnswer1 = await ownerSession['getWalletAnswer(bytes32,address)'](contractQuestionIds[0], userWallet.address);
          const walletAnswer2 = await ownerSession['getWalletAnswer(string,address)'](questionIds[1], userWallet.address);

          expect(walletAnswer1).to.be.eq(utils.keccak256(utils.toUtf8Bytes('a')));
          expect(walletAnswer2).to.be.eq(utils.keccak256(utils.toUtf8Bytes('b')));
        });

        it('should return question answers', async () => {
          const [ownerSession] = await getOwnerSession();
          const [, userWallet] = await getUserSession();
          const user2Wallet = await getUser2Wallet();

          await stakePool.mock.isStaked.withArgs(userWallet.address).returns(true);
          await stakePool.mock.isStaked.withArgs(user2Wallet.address).returns(true);

          await ownerSession.setWalletAnswers(userWallet.address, [questionIds[0], questionIds[1]], ['a', 'b']);
          await ownerSession.setWalletAnswers(user2Wallet.address, [questionIds[1], questionIds[2]], ['c', 'd']);

          const contractQuestionIds = await ownerSession.getQuestionIds();

          const expectedAnswersList = [
            [{ wallet: userWallet.address, answer: 'a' }],
            [{ wallet: userWallet.address, answer: 'b' }, { wallet: user2Wallet.address, answer: 'c' }],
            [{ wallet: user2Wallet.address, answer: 'd' }],
          ];

          for (let i = 0; i < contractQuestionIds.length; i++) {
            const answers = await ownerSession['getQuestionAnswers(bytes32)'](contractQuestionIds[i]);
            const expectedAnswers = expectedAnswersList[i];

            for (let j = 0; j < answers.length; j++) {
              expect(answers[j].wallet).to.eq(expectedAnswers[j].wallet);
              expect(answers[j].answer).to.eq(utils.keccak256(utils.toUtf8Bytes(expectedAnswers[j].answer)));
            }
          }

          for (let i = 0; i < questionIds.length; i++) {
            const answers = await ownerSession['getQuestionAnswers(string)'](questionIds[i]);
            const expectedAnswers = expectedAnswersList[i];

            for (let j = 0; j < answers.length; j++) {
              expect(answers[j].wallet).to.eq(expectedAnswers[j].wallet);
              expect(answers[j].answer).to.eq(utils.keccak256(utils.toUtf8Bytes(expectedAnswers[j].answer)));
            }
          }
        });

        describe('should not', async () => {
          describe('set single answer', () => {
            it('if not owner', async () => {
              const [userSession, userWallet] = await getUserSession();

              await expect(userSession.setWalletAnswer(userWallet.address, questionIds[0], 'a'))
                .to.be.revertedWith('Ownable: caller is not the owner');
            });

            it('if not active', async () => {
              const [ownerSession] = await getOwnerSession();
              const [, userWallet] = await getUserSession();

              await ownerSession.finalize();

              await expect(ownerSession.setWalletAnswer(userWallet.address, questionIds[0], 'a'))
                .to.be.revertedWith('Contract is not active');
            });

            it('if wallet not staked', async () => {
              const [ownerSession] = await getOwnerSession();
              const [, userWallet] = await getUserSession();

              await stakePool.mock.isStaked.withArgs(userWallet.address).returns(false);

              await expect(ownerSession.setWalletAnswer(userWallet.address, questionIds[0], 'a'))
                .to.be.revertedWith('Wallet is not staked');
            });
          });

          describe('set multiple answers', () => {
            it('if not owner', async () => {
              const [userSession, userWallet] = await getUserSession();

              const questions = [questionIds[0]];
              const answers = ['a'];

              await expect(userSession.setWalletAnswers(userWallet.address, questions, answers))
                .to.be.revertedWith('Ownable: caller is not the owner');
            });

            it('if not active', async () => {
              const [ownerSession] = await getOwnerSession();
              const [, userWallet] = await getUserSession();

              await ownerSession.finalize();

              const questions = [questionIds[0]];
              const answers = ['a'];

              await expect(ownerSession.setWalletAnswers(userWallet.address, questions, answers))
                .to.be.revertedWith('Contract is not active');
            });

            it('if wallet not staked', async () => {
              const [ownerSession] = await getOwnerSession();
              const [, userWallet] = await getUserSession();

              await stakePool.mock.isStaked.withArgs(userWallet.address).returns(false);

              const questions = [questionIds[0]];
              const answers = ['a'];

              await expect(ownerSession.setWalletAnswers(userWallet.address, questions, answers))
                .to.be.revertedWith('Wallet is not staked');
            });
          });
        });
      });

      describe('User session', () => {
        it('shoud set single answer', async () => {
          const [userSession, userWallet] = await getUserSession();

          await stakePool.mock.isStaked.withArgs(userWallet.address).returns(true);

          const tx = await userSession.setAnswer(questionIds[0], 'a');

          const questionIdBytes = utils.keccak256(utils.toUtf8Bytes(questionIds[0]));
          const blockTimestamp = (await ethers.provider.getBlock('latest')).timestamp;

          await expect(tx)
            .to.emit(userSession, 'AnswerSet')
            .withArgs(userWallet.address, questionIdBytes, blockTimestamp);
        });

        it('shoud set multiple answers', async () => {
          const [userSession, userWallet] = await getUserSession();

          await stakePool.mock.isStaked.withArgs(userWallet.address).returns(true);

          const questions = [questionIds[0], questionIds[1]];
          const answers = ['a', 'b'];

          const tx = await userSession.setAnswers(questions, answers);

          const blockTimestamp = (await ethers.provider.getBlock('latest')).timestamp;

          for (const questionId of questions) {
            const questionIdBytes = utils.keccak256(utils.toUtf8Bytes(questionId));

            await expect(tx)
              .to.emit(userSession, 'AnswerSet')
              .withArgs(userWallet.address, questionIdBytes, blockTimestamp);
          }
        });

        it('should update answer', async () => {
          const [userSession, userWallet] = await getUserSession();

          await stakePool.mock.isStaked.withArgs(userWallet.address).returns(true);

          const tx = await userSession.setAnswer(questionIds[0], 'a');

          const questionIdBytes = utils.keccak256(utils.toUtf8Bytes(questionIds[0]));
          const blockTimestamp = (await ethers.provider.getBlock('latest')).timestamp;

          await expect(tx)
            .to.emit(userSession, 'AnswerSet')
            .withArgs(userWallet.address, questionIdBytes, blockTimestamp);

          const tx2 = await userSession.setAnswer(questionIds[0], 'b');
          const block2Timestamp = (await ethers.provider.getBlock('latest')).timestamp;

          await expect(tx2)
            .to.emit(userSession, 'AnswerSet')
            .withArgs(userWallet.address, questionIdBytes, block2Timestamp);
        });

        describe('should not', async () => {
          describe('set single answer', () => {
            it('if not active', async () => {
              const [ownerSession] = await getOwnerSession();
              const [userSession] = await getUserSession();

              await ownerSession.finalize();

              await expect(userSession.setAnswer(questionIds[0], 'a'))
                .to.be.revertedWith('Contract is not active');
            });

            it('if wallet not staked', async () => {
              const [userSession, userWallet] = await getUserSession();

              await stakePool.mock.isStaked.withArgs(userWallet.address).returns(false);

              await expect(userSession.setAnswer(questionIds[0], 'a'))
                .to.be.revertedWith('Wallet is not staked');
            });

            it('if question not registered', async () => {
              const [userSession, userWallet] = await getUserSession();

              await stakePool.mock.isStaked.withArgs(userWallet.address).returns(true);

              const questionId = uuidv4();
              const answer = 'a';

              await expect(userSession.setAnswer(questionId, answer))
                .to.be.revertedWith('Question not registered');
            });

            it('if answer is empty', async () => {
              const [userSession, userWallet] = await getUserSession();

              await stakePool.mock.isStaked.withArgs(userWallet.address).returns(true);

              const questionId = questionIds[0];
              const answer = '';

              await expect(userSession.setAnswer(questionId, answer))
                .to.be.revertedWith('Answer cannot be empty');
            });

            it('if answer is not a option', async () => {
              const [userSession, userWallet] = await getUserSession();

              await stakePool.mock.isStaked.withArgs(userWallet.address).returns(true);

              const questionId = questionIds[0];
              const answer = 'd';

              await expect(userSession.setAnswer(questionId, answer))
                .to.be.revertedWith('Answer must be one of the options');
            });
          });

          describe('set multiple answers', () => {
            it('if not active', async () => {
              const [ownerSession] = await getOwnerSession();
              const [userSession] = await getUserSession();

              await ownerSession.finalize();

              const questions = [questionIds[0]];
              const answers = ['a'];

              await expect(userSession.setAnswers(questions, answers))
                .to.be.revertedWith('Contract is not active');
            });

            it('if wallet not staked', async () => {
              const [userSession, userWallet] = await getUserSession();

              await stakePool.mock.isStaked.withArgs(userWallet.address).returns(false);

              const questions = [questionIds[0]];
              const answers = ['a'];

              await expect(userSession.setAnswers(questions, answers))
                .to.be.revertedWith('Wallet is not staked');
            });

            it('answers are empty', async () => {
              const [userSession, userWallet] = await getUserSession();

              await stakePool.mock.isStaked.withArgs(userWallet.address).returns(true);

              await expect(userSession.setAnswers([], []))
                .to.be.revertedWith('Answers cannot be empty');
            });

            it('questions and answers mismatch', async () => {
              const [userSession, userWallet] = await getUserSession();

              await stakePool.mock.isStaked.withArgs(userWallet.address).returns(true);

              const questions = [questionIds[0]];
              const answers: string[] = [];

              await expect(userSession.setAnswers(questions, answers))
                .to.be.revertedWith('Questions and answers length mismatch');
            });
          });
        });
      });
    });

    describe('Get points / score', () => {
      const questionIds = [uuidv4(), uuidv4(), uuidv4()];
      const questionPoints = [10, 20, 30];
      const options = [['a', 'b', 'c'], [], []];

      beforeEach(async () => {
        const [ownerSession] = await getOwnerSession();

        await ownerSession.registerQuestions(questionIds, questionPoints, options);

        await ownerSession.setAnswerKey(questionIds[0], 'a', []);
        await ownerSession.setAnswerKey(questionIds[1], 'answer', ['alternative']);
      });

      it('should get wallet points and score', async () => {
        const [ownerSession] = await getOwnerSession();
        const [, userWallet] = await getUserSession();
        const user2Wallet = await getUser2Wallet();
        const user3Wallet = await getUser3Wallet();
        const user4Wallet = await getUser4Wallet();

        const answers = [
          {
            wallet: userWallet.address,
            questions: [questionIds[0], questionIds[1]],
            answers: ['a', 'wrong'],
            expectedPoints: 10,
            expectedScore: 17,
          },
          {
            wallet: user2Wallet.address,
            questions: [questionIds[1], questionIds[2]],
            answers: ['answer', 'any'],
            expectedPoints: 50,
            expectedScore: 84,
          },
          {
            wallet: user3Wallet.address,
            questions: [questionIds[0], questionIds[1]],
            answers: ['b', 'alternative'],
            expectedPoints: 20,
            expectedScore: 34,
          },
          {
            wallet: user4Wallet.address,
            questions: [questionIds[0], questionIds[1], questionIds[2]],
            answers: ['b', 'wrong', 'any'],
            expectedPoints: 30,
            expectedScore: 50,
          },
        ];

        for (const answer of answers) {
          await stakePool.mock.isStaked.withArgs(answer.wallet).returns(true);

          await ownerSession.setWalletAnswers(answer.wallet, answer.questions, answer.answers);

          const walletPoints = await ownerSession.getPoints(answer.wallet);
          const walletScore = await ownerSession.getScore(answer.wallet);

          expect(walletPoints).to.eq(answer.expectedPoints);
          expect(walletScore).to.eq(answer.expectedScore);
        }
      });

      it('should not get wallet points/score if not staked', async () => {
        const [, userWallet] = await getUserSession();

        await stakePool.mock.isStaked.withArgs(userWallet.address).returns(false);

        await expect(auditAnswers.getPoints(userWallet.address))
          .to.be.revertedWith('Wallet is not staked');

        await expect(auditAnswers.getScore(userWallet.address))
          .to.be.revertedWith('Wallet is not staked');
      });
    });

    describe("Finalize", async () => {
      it("should finalize", async () => {
        const [ownerSession] = await getOwnerSession();

        const tx = await ownerSession.finalize();
        const blockTimestamp = (await ethers.provider.getBlock('latest')).timestamp;

        await expect(tx)
          .to.emit(ownerSession, 'Finalized')
          .withArgs(blockTimestamp);;

        const status = await ownerSession.status();

        expect(status).to.eq(1);
      });

      describe("should not finalize", async () => {
        it('when not owner', async () => {
          const [userSession] = await getUserSession();

          await expect(userSession.finalize())
            .to.be.revertedWith('Ownable: caller is not the owner');
        });

        it("when not active", async () => {
          const [ownerSession] = await getOwnerSession();

          await ownerSession.finalize();

          await expect(ownerSession.finalize())
            .to.be.revertedWith("Contract is not active");
        });
      });
    });
  });
});