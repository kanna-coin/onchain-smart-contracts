// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

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
contract KannaToken is IKannaToken, ERC20, Ownable, AccessControl {

    bytes32 private constant NO_TRANSFER_FEE = keccak256("NO_TRANSFER_FEE");
    bytes32 private constant MINTER_ROLE = keccak256("MINTER_ROLE");

    uint256 private immutable initialSupply = 10_000_000 * 10**decimals();

    uint256 private immutable maxSupply = 19_000_000 * 10**decimals();

    uint256 private constant TRANSFER_FEE_DIVISOR = 100_00;
    uint256 private transferFee = 1_00;

    address private transferFeeRecipient;
    address private treasury = address(0);

    event TransferFee(
        address from,
        address to,
        uint256 amount,
        uint fee
    );

    event TransferFeeUpdate(
        address indexed votingContractAddress,
        uint newFee
    );


    /**
     * @dev Initializes KNN Token (KNN) with {initialSupply} to
     * a given deployment address {deployerAddress}
     *
     * Emits {Minted} and {Transfer} events.
     */
    constructor(address _transferFeeRecipient) ERC20("KNN Token", "KNN") {
        _grantRole(NO_TRANSFER_FEE, _transferFeeRecipient);

        transferFeeRecipient = _transferFeeRecipient;
    }
    
    function updateTransferFeeRecipient(address newRecipient) external onlyOwner {
        _revokeRole(NO_TRANSFER_FEE, transferFeeRecipient);
        _grantRole(NO_TRANSFER_FEE, newRecipient);

        transferFeeRecipient = newRecipient;
    }

    /**
     * @dev addresses the current treasury smart contract
     *
     * Emits {RoleGranted} and {Transfer} events.
     * May revoke roles from provious contract
     */
    function initializeTreasury() external onlyOwner {
        require(treasury != address(0), "Treasury not set");
        require(totalSupply() == 0, "Treasury already initialized");
        _mint(treasury, initialSupply);
        // ℹ️ Removed the `Minted` address, see note above.
    }
    
    function updateTreasury(address newTreasury) external onlyOwner {
        if (treasury != address(0)) {
            _revokeRole(NO_TRANSFER_FEE, treasury);
        }

        _grantRole(NO_TRANSFER_FEE, newTreasury);
        treasury = newTreasury;
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
     * - must be a  multisig wallet or owner (requires owner)
     */
    function updateTransferFee(uint256 newFee) external onlyOwner {
        require(fee >= 0 && newFee <= TRANSFER_FEE_DIVISOR, "Invalid fee");
        transferFee = newFee;
        
        emit TransferFeeUpdate(address(msg.sender), newFee);
    }

    function _transfer(address from, address to, uint256 amount) internal override {
        uint256 fee = calculateTransferFee(from, to, amount);

        // ℹ️ The line below can be wrapped in an `unchecked { }` block if `updateTransferFee` can ensure that the fee is never higher than 100%.
        super._transfer(from, to, amount - fee);
        // Saves up some gas if fee is zero
        if (fee > 0) {
            super._transfer(from, kannaDeployerAddress, fee);
        }
        // ℹ️ No need for an extra event. If you want to calculate the total of fees paid, you can get all token transfers made to the deployer address.
    }
    
    function calculateTransferFee(address from, address to, uint256 amount) internal view returns (uint256) {
        if (transferFee == 0 || hasRole(NO_TRANSFER_FEE, from) || hasRole(NO_TRANSFER_FEE, to)) {
            return 0;
        }

        uint256 fee = amount.mul(transferFee).div(TRANSFER_FEE_DIVISOR);
        require(fee > 0, "Transfer amount too low");

        return fee;
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
     * - must be a `MINTER_ROLE` contract
     * - totalSupply should not exceed {maxSupply}
     */
    function mint(uint256 amount) external override onlyRole(MINTER_ROLE) {
        require(treasuryAddress != address(0), "No treasury");
        require(amount > 0, "Invalid Amount");
        require(totalSupply() + amount <= maxSupply, "Maximum Supply reached!");

        _mint(treasuryAddress, amount);
    }

    /**
     * @dev May emit a {RoleGranted} event.
     *
     * Requirements:
     *
     * - must be a contract owner (same of deployer address initially)
     */
    function noTransferFee(address user) external onlyOwner {
        _grantRole(NO_TRANSFER_FEE, user);
    }

    /**
     * @dev May emit a {RoleGranted} event.
     *
     * Addressed to be used by DAO voting contract
     *
     * Requirements:
     *
     * - must be a multisig or owner (requires onlyOwner)
     */
    function addMinter(address newMinter) external onlyOwner {
        _grantRole(MINTER_ROLE, newMinter);

        if (hasRole(NO_TRANSFER_FEE, msg.sender)) return;

        _grantRole(NO_TRANSFER_FEE, newMinter);
    }
    function removeMinter(address minter) external onlyOwner {
        _revokeRole(MINTER_ROLE, minter);
    }
}
