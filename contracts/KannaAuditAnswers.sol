// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {IKannaAuditScoreProvider} from "./interfaces/IKannaAuditScoreProvider.sol";
import {KannaAuditStakePool} from "./KannaAuditStakePool.sol";

contract KannaAuditAnswers is IKannaAuditScoreProvider, Ownable {
    enum Status {
        Active,
        Finalized
    }

    struct Question {
        bytes32 id;
        uint8 points;
        bool hasOptions;
        bytes32 answerKey;
        mapping(bytes32 => bool) options;
        mapping(bytes32 => bool) alternatives;
    }

    struct Answer {
        address wallet;
        bytes32 questionId;
        bytes32 answer;
    }

    event QuestionRegistered(bytes32 indexed questionId, uint8 points, uint256 timestamp);
    event AnswerKeySet(bytes32 indexed questionId, uint256 timestamp);
    event AnswerSet(address indexed wallet, bytes32 indexed questionId, uint256 timestamp);
    event Finalized(uint256 timestamp);

    address public stakePool;
    Status public status = Status.Active;
    uint16 public totalPoints;

    mapping(bytes32 => Question) private questions;
    bytes32[] private questionIds;

    mapping(bytes32 => address[]) private questionWallets;
    mapping(bytes32 => mapping(address => bytes32)) public questionAnswers;

    constructor(address stakePoolAddress) {
        require(stakePoolAddress != address(0), "Stake pool address cannot be zero");

        stakePool = stakePoolAddress;
    }

    modifier isActive() {
        require(status == Status.Active, "Contract is not active");
        _;
    }

    modifier isStaked(address wallet) {
        require(KannaAuditStakePool(stakePool).isStaked(wallet), "Wallet is not staked");
        _;
    }

    function getQuestionIds() external view returns (bytes32[] memory) {
        return questionIds;
    }

    function getQuestionPoints(string memory questionUuid) external view returns (uint8) {
        return _getQuestionPoints(keccak256(bytes(questionUuid)));
    }

    function getQuestionPoints(bytes32 questionId) external view returns (uint8) {
        return _getQuestionPoints(questionId);
    }

    function getQuestionWallets(string memory questionUuid) external view returns (address[] memory) {
        return _getQuestionWallets(keccak256(bytes(questionUuid)));
    }

    function getQuestionWallets(bytes32 questionId) external view returns (address[] memory) {
        return _getQuestionWallets(questionId);
    }

    function getQuestionAnswers(string memory questionUuid) external view returns (Answer[] memory) {
        return _getQuestionAnswers(keccak256(bytes(questionUuid)));
    }

    function getQuestionAnswers(bytes32 questionId) external view returns (Answer[] memory) {
        return _getQuestionAnswers(questionId);
    }

    function getWalletAnswer(bytes32 questionId, address wallet) external view returns (bytes32) {
        return _getWalletAnswer(questionId, wallet);
    }

    function getWalletAnswer(string memory questionUuid, address wallet) external view returns (bytes32) {
        return _getWalletAnswer(keccak256(bytes(questionUuid)), wallet);
    }

    function getWalletAnswers(address wallet) external view returns (Answer[] memory) {
        uint8 answersCount = 0;

        for (uint256 i = 0; i < questionIds.length; i++) {
            if (questionAnswers[questionIds[i]][wallet] != 0) {
                answersCount++;
            }
        }

        Answer[] memory answers = new Answer[](answersCount);
        uint8 indexCount = 0;

        for (uint256 i = 0; i < questionIds.length; i++) {
            bytes32 questionId = questionIds[i];
            bytes32 answer = questionAnswers[questionId][wallet];

            if (answer == 0) {
                continue;
            }

            answers[indexCount] = Answer(wallet, questionId, answer);

            indexCount++;
        }

        return answers;
    }

    /**
     * @dev Returns the points of a wallet
     */
    function getPoints(address wallet) external isStaked(wallet) view returns (uint256) {
        return _pointsOf(wallet);
    }

    /**
     * @dev Returns the score of a wallet
     */
    function getScore(address wallet) external isStaked(wallet) view returns (uint256) {
        uint256 points = _pointsOf(wallet) * 100;

        return points / totalPoints + (points % totalPoints == 0 ? 0 : 1);
    }

    /**
     * @dev Register a question
     *
     * Requirements:
     *
     * - the caller must have admin role.
     * - the contract must be active.
     *
     * Emit a {QuestionRegistred} event.
     */
    function registerQuestion(string memory questionUuid, uint8 points, string[] memory options) external isActive onlyOwner {
        _registerQuestion(questionUuid, points, options);
    }

    /**
     * @dev Register questions in batch
     *
     * Requirements:
     *
     * - the caller must have admin role.
     * - the contract must be active.
     *
     * Emit a {QuestionRegistred} events.
     */
    function registerQuestions(string[] memory questionsUuid, uint8[] memory points, string[][] memory options) external isActive onlyOwner {
        require(questionsUuid.length > 0, "Questions cannot be empty");
        require(questionsUuid.length == points.length, "Questions and points length mismatch");
        require(questionsUuid.length == options.length, "Questions and options length mismatch");

        for (uint256 i = 0; i < questionsUuid.length; i++) {
            _registerQuestion(questionsUuid[i], points[i], options[i]);
        }
    }

    /**
     * @dev Set the answer key for a question
     *
     * Requirements:
     *
     * - the caller must have admin role.
     * - the contract must be active.
     *
     * Emit a {QuestionRegistred} event.
     */
    function setAnswerKey(
        string memory questionUuid,
        string memory answerKey,
        string[] memory alternatives
    ) external isActive onlyOwner {
        bytes32 questionId = keccak256(bytes(questionUuid));

        require(_questionRegistered(questionId), "Question not registered");
        require(bytes(answerKey).length > 0, "Answer key connot be empty");

        bytes32 answerKeyBytes = keccak256(bytes(answerKey));

        require(!questions[questionId].hasOptions || questions[questionId].options[answerKeyBytes], "Answer key must be one of the options");

        questions[questionId].answerKey = answerKeyBytes;

        for (uint256 i = 0; i < alternatives.length; i++) {
            require(bytes(alternatives[i]).length > 0, "Alternarive key connot be empty");

            bytes32 alternativeBytes = keccak256(bytes(alternatives[i]));

            require(!questions[questionId].hasOptions || questions[questionId].options[alternativeBytes], "Alternative must be one of the options");

            questions[questionId].alternatives[alternativeBytes] = true;
        }

        emit AnswerKeySet(questionId, block.timestamp);
    }

    function setAnswer(string memory questionUuid, string memory answer) external isActive isStaked(msg.sender) {
        _setAnswer(msg.sender, questionUuid, answer);
    }

    function setAnswers(string[] memory questionsUuid, string[] memory answers) external isActive isStaked(msg.sender) {
        _setAnswers(msg.sender, questionsUuid, answers);
    }

    function setWalletAnswer(address wallet, string memory questionUuid, string memory answer) external isActive onlyOwner isStaked(wallet) {
        _setAnswer(wallet, questionUuid, answer);
    }

    function setWalletAnswers(address wallet, string[] memory questionsUuid, string[] memory answers) external isActive onlyOwner isStaked(wallet) {
        _setAnswers(wallet, questionsUuid, answers);
    }

    /**
     * @dev Finalize the contract
     *
     * Requirements:
     *
     * - the caller must have admin role.
     * - the contract must be active.
     *
     * Emit a {Finalized} event.
     */
    function finalize() external onlyOwner isActive {
        status = Status.Finalized;

        emit Finalized(block.timestamp);
    }

    function _registerQuestion(string memory questionUuid, uint8 points, string[] memory options) internal {
        bytes memory questionUuidBytes = bytes(questionUuid);

        require(questionUuidBytes.length == 36, "UUID must be 36 characters long");

        bytes32 questionId = keccak256(questionUuidBytes);

        require(!_questionRegistered(questionId), "Question already registered");

        Question storage question = questions[questionId];
        question.id = questionId;
        question.points = points;
        question.hasOptions = options.length > 0;

        for (uint256 i = 0; i < options.length; i++) {
            question.options[keccak256(bytes(options[i]))] = true;
        }

        questionIds.push(questionId);

        totalPoints += points;

        emit QuestionRegistered(questionId, points, block.timestamp);
    }

    function _setAnswers(address wallet, string[] memory questionsUuid, string[] memory answers) internal {
        require(questionsUuid.length > 0, "Answers cannot be empty");
        require(questionsUuid.length == answers.length, "Questions and answers length mismatch");

        for (uint256 i = 0; i < questionsUuid.length; i++) {
            _setAnswer(wallet, questionsUuid[i], answers[i]);
        }
    }

    function _setAnswer(address wallet, string memory questionUuid, string memory answer) internal {
        bytes32 questionId = keccak256(bytes(questionUuid));

        require(_questionRegistered(questionId), "Question not registered");
        require(bytes(answer).length > 0, "Answer cannot be empty");

        bytes32 answerBytes = keccak256(bytes(answer));

        require(!questions[questionId].hasOptions || questions[questionId].options[answerBytes], "Answer must be one of the options");

        if (questionAnswers[questionId][wallet] == 0) {
            questionWallets[questionId].push(wallet);
        }

        questionAnswers[questionId][wallet] = answerBytes;

        emit AnswerSet(wallet, questionId, block.timestamp);
    }

    function _questionRegistered(bytes32 questionId) internal view returns (bool) {
        return questions[questionId].id != 0;
    }

    function _pointsOf(address wallet) internal view returns (uint256) {
        uint256 walletPoints = 0;

        for (uint256 i = 0; i < questionIds.length; i++) {
            bytes32 questionId = questionIds[i];

            if (_walletCorrectAnswer(wallet, questionId)) {
                walletPoints += questions[questionId].points;
            }
        }

        return walletPoints;
    }

    function _walletCorrectAnswer(address wallet, bytes32 questionId) internal view returns (bool) {
        bytes32 answer = questionAnswers[questionId][wallet];

        if (answer == 0) {
            return false;
        }

        bytes32 answerKey = questions[questionId].answerKey;

        return answerKey == 0
            || answer == answerKey
            || questions[questionId].alternatives[answer];
    }

    function _getQuestionPoints(bytes32 questionId) internal view returns (uint8) {
        return questions[questionId].points;
    }

    function _getQuestionWallets(bytes32 questionId) internal view returns (address[] storage) {
        return questionWallets[questionId];
    }

    function _getQuestionAnswers(bytes32 questionId) internal view returns (Answer[] memory) {
        Answer[] memory answers = new Answer[](questionWallets[questionId].length);

        for (uint256 i = 0; i < questionWallets[questionId].length; i++) {
            address wallet = questionWallets[questionId][i];
            bytes32 answer = questionAnswers[questionId][wallet];

            answers[i] = Answer(wallet, questionId, answer);
        }

        return answers;
    }

    function _getWalletAnswer(bytes32 questionId, address wallet) internal view returns (bytes32) {
        return questionAnswers[questionId][wallet];
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId) public view virtual returns (bool) {
        return interfaceId == type(IKannaAuditScoreProvider).interfaceId
            || interfaceId == type(IERC165).interfaceId;
    }
}
