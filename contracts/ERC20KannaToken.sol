// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

import {IKannaToken} from "./interfaces/IKannaToken.sol";

import "hardhat/console.sol";

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

    bytes32 private constant NO_TRANSFER_FEE = keccak256("NO_TRANSFER_FEE");
    bytes32 private constant VOTER_ROLE = keccak256("VOTER_ROLE");
    bytes32 private constant MILESTONES_MINTER_ROLE =
        keccak256("MILESTONES_MINTER_ROLE");

    uint256 private immutable initialSupply = 10000000 * 10**decimals();

    uint256 private immutable maxSupply = 19000000 * 10**decimals();

    uint256 private constant transactionFeeDecimalAdjust = 1000 * 100;
    uint256 private transactionFee = 1000;

    address private kannaDeployerAddress;

    event TransactionFee(
        address from,
        address to,
        uint256 amount,
        uint indexed date,
        uint fee
    );

    event ChangeOfFee(
        address indexed votingContractAddress,
        uint date,
        uint newFee
    );

    event Minted(address to, uint256 amount, uint indexed date);

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
     * @dev May emit a {ChangeOfFee} event.
     *
     * Addressed to be used by DAO voting contract
     *
     * @param fee should consider {transactionFeeDecimalAdjust} to avoid overflow
     *
     * Requirements:
     *
     * - must be a voting contract (requires VOTER_ROLE)
     */
    function updateTransactionFee(uint fee) external onlyRole(VOTER_ROLE) {
        require(address(msg.sender).isContract());
        require(fee >= 0, "Invalid fee");

        emit ChangeOfFee(address(msg.sender), block.timestamp, fee);
        transactionFee = fee;
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
        ) {
            console.log("noFee", amount / 1e18, address(from), address(to));
            return amount;
        }

        uint256 feeAmount = amount.mul(transactionFee).div(
            transactionFeeDecimalAdjust
        );
        require(feeAmount > 0, "Invalid fee amount");

        uint256 finalAmount = amount.sub(feeAmount);
        super._transfer(from, kannaDeployerAddress, feeAmount);

        emit TransactionFee(from, to, amount, block.timestamp, feeAmount);

        console.log(
            "transactionFee",
            amount / 1e18,
            feeAmount / 1e18,
            finalAmount / 1e18
        );

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

        address owner = address(msg.sender);

        uint256 finalAmount = applyTransactionFee(owner, to, amount);

        super._transfer(owner, to, finalAmount);

        return true;
    }

    /** @dev Creates `amount` tokens and assigns them to `address(msg.sender)`, increasing
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
        require(address(msg.sender).isContract());
        require(
            amount.add(super.totalSupply()) <= maxSupply,
            "Maximum Supply reached!"
        );

        emit Minted(address(msg.sender), amount, block.timestamp);

        _mint(address(msg.sender), amount);
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
