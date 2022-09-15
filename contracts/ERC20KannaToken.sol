// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

import {IKannaToken} from "./interfaces/IKannaToken.sol";

/** @title KNN Token
    @author KANNA
    @notice This is a OpenZeppelin {IERC20} token contract implementation of KNN Token.
    @dev See {IERC20}
        for more documentation regarding {ERC20},
        reach out to https://docs.openzeppelin.com/contracts/4.x/erc20
    @custom:github  https://github.com/kanna-coin
    @custom:site https://kannacoin.io
    */
contract ERC20KannaToken is IKannaToken, ERC20, Ownable, AccessControl {
    using SafeMath for uint256;
    using Address for address;

    bytes32 public constant NO_TRANSFER_FEE = keccak256("NO_TRANSFER_FEE");
    bytes32 public constant VOTER_ROLE = keccak256("VOTER_ROLE");
    bytes32 public constant MILESTONES_MINTER_ROLE =
        keccak256("MILESTONES_MINTER_ROLE");

    uint256 private initialSupply = 10000000 * 10**decimals();
    uint256 private maxSupply = 19000000 * 10**decimals();

    uint private transactionFeeDecimalAdjust = 1000;
    uint private transactionFee = 1 * transactionFeeDecimalAdjust;
    address private kannaDeployerAddress;

    event TransactionFee(
        address indexed from,
        address indexed to,
        uint256 amount,
        uint date,
        uint fee
    );

    event FeeChangedByDAOVoting(
        address indexed votingContractAddress,
        uint date,
        uint newFee
    );

    event Minted(address indexed to, uint256 amount, uint date);

    /**
     * @dev Initializes KNN Token (KNN) with {initialSupply} to
     * a given deployment address {deployerAddress}
     *
     * Emits {Minted} and {Transfer} events.
     */
    constructor(address deployerAddress) ERC20("KNN Token", "KNN") {
        _grantRole(NO_TRANSFER_FEE, deployerAddress);
        _mint(deployerAddress, initialSupply);

        kannaDeployerAddress = deployerAddress;
    }

    /**
     * @dev May emit a {FeeChangedByDAOVoting} event.
     *
     * Addressed to be used by DAO voting contract
     *
     * @param newFee should consider {transactionFeeDecimalAdjust} to avoid overflow
     *
     * Requirements:
     *
     * - must be a voting contract (requires VOTER_ROLE)
     */
    function updateTransactionFee(uint newFee) external onlyRole(VOTER_ROLE) {
        require(_msgSender().isContract());
        require(newFee >= 0, "Invalid fee");

        emit FeeChangedByDAOVoting(_msgSender(), block.timestamp, newFee);
        transactionFee = newFee;
    }

    /**
     * @dev See {IERC20-transferFrom}.
     *
     *  May emit {TransactionFee} event.
     * Requirements:
     *
     * - `to` cannot be the zero address.
     * - the caller must have a balance of at least `amount`.
     */
    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) public override(ERC20, IKannaToken) returns (bool) {
        require(amount > 0, "Invalid amount");

        uint256 finalAmount = applyTransactionFee(from, to, amount);

        return super.transferFrom(from, to, finalAmount);
    }

    /**
     * @notice Apply transaction fee (when applicable)
     * for transfers without KANNA SmartContracts
     * or peer/market transactions.
     *
     * @dev requires {transactionFee} to be set above 0
     * otherwise, fees are ignored.
     *
     * see {updateTransactionFee}
     */
    function applyTransactionFee(
        address from,
        address to,
        uint256 amount
    ) private returns (uint256) {
        if (
            transactionFee == 0 ||
            hasRole(NO_TRANSFER_FEE, from) ||
            hasRole(NO_TRANSFER_FEE, to)
        ) return amount;

        uint256 feeAmount = amount.mul(transactionFee).div(
            100 * transactionFeeDecimalAdjust
        );
        require(feeAmount > 0, "Invalid fee amount");

        uint256 finalAmount = amount.sub(feeAmount);
        super._transfer(from, kannaDeployerAddress, feeAmount);

        emit TransactionFee(from, to, amount, block.timestamp, feeAmount);

        return finalAmount;
    }

    /**
     * @dev See {IERC20-transfer}.
     *
     *  May emit {TransactionFee} event.
     * Requirements:
     *
     * - `to` cannot be the zero address.
     * - the caller must have a balance of at least `amount`.
     */
    function transfer(address to, uint256 amount)
        public
        virtual
        override(ERC20, IERC20)
        returns (bool)
    {
        require(amount > 0, "Invalid amount");

        address owner = _msgSender();

        uint256 finalAmount = applyTransactionFee(owner, to, amount);

        super._transfer(owner, to, finalAmount);

        return true;
    }

    /** @dev Creates `amount` tokens and assigns them to `_msgSender()`, increasing
     * the total supply.
     *
     * Limited to 19MM KNN Token Maximum Supply availability.
     *
     * May emit {Minted} and {Transfer} events.
     *
     * Requirements:
     *
     * - must be a `MILESTONES_MINTER_ROLE` contract
     * - totalSupply should not exceed {maxSupply}
     */
    function mint(uint256 amount)
        external
        override(IKannaToken)
        onlyRole(MILESTONES_MINTER_ROLE)
    {
        require(amount > 0, "Invalid Amount");
        require(_msgSender().isContract());
        require(
            amount.add(super.totalSupply()) <= maxSupply,
            "Maximum Supply reached!"
        );

        emit Minted(_msgSender(), amount, block.timestamp);

        _mint(_msgSender(), amount);
    }

    /**
     * @dev May emit a {RoleGranted} event.
     *
     * Requirements:
     *
     * - must be a contract owner (same of deployer address initially)
     */
    function addRewardContract(address rewardContract) external onlyOwner {
        require(rewardContract.isContract());
        _grantRole(NO_TRANSFER_FEE, rewardContract);
    }

    /**
     * @dev May emit a {RoleGranted} event.
     *
     * Requirements:
     *
     * - must be a contract owner (same of deployer address initially)
     */
    function addVotingContract(address votingContract) external onlyOwner {
        require(votingContract.isContract());

        _grantRole(VOTER_ROLE, votingContract);
        _grantRole(NO_TRANSFER_FEE, votingContract);
    }

    /**
     * @dev May emit a {RoleGranted} event.
     *
     * Addressed to be used by DAO voting contract
     *
     * Requirements:
     *
     * - must be a voting contract (requires VOTER_ROLE)
     */
    function addMilestoneContract(address milestoneMinterAddress)
        external
        onlyRole(VOTER_ROLE)
    {
        require(milestoneMinterAddress.isContract());

        _grantRole(MILESTONES_MINTER_ROLE, milestoneMinterAddress);
        _grantRole(NO_TRANSFER_FEE, milestoneMinterAddress);
    }
}
