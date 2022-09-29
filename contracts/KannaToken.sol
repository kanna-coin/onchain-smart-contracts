// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/** @title KNN Token
    @author KANNA
    @notice This is a OpenZeppelin {IERC20} token contract implementation of KNN Token.
    @dev See {IERC20}
        for more documentation regarding {ERC20},
        reach out to https://docs.openzeppelin.com/contracts/4.x/erc20
    @custom:github  https://github.com/kanna-coin
    @custom:site https://kannacoin.io
    */
contract KannaToken is ERC20, Ownable, AccessControl {
    bytes32 public constant NO_TRANSFER_FEE = keccak256("NO_TRANSFER_FEE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    uint256 public immutable INITIAL_SUPPLY = 10_000_000 * 10**decimals();

    uint256 public immutable MAX_SUPPLY = 19_000_000 * 10**decimals();

    uint256 public constant TRANSFER_FEE_DIVISOR = 100_00;

    uint256 public transferFee = 1_00;
    address public transferFeeRecipient;
    address public treasury = address(0);

    event TransferFeeUpdate(address indexed sender, uint newFee);

    /**
     * @dev Initializes KNN Token (KNN)
     *
     * Emits {Minted} and {Transfer} events.
     */
    constructor(address _transferFeeRecipient) ERC20("KNN Token", "KNN") {
        _grantRole(NO_TRANSFER_FEE, _transferFeeRecipient);

        transferFeeRecipient = _transferFeeRecipient;
    }

    function updateTransferFeeRecipient(address newRecipient)
        external
        onlyOwner
    {
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
        _mint(treasury, INITIAL_SUPPLY);
    }

    function updateTreasury(address newTreasury) external onlyOwner {
        if (treasury != address(0)) {
            _revokeRole(NO_TRANSFER_FEE, treasury);
        }

        _grantRole(NO_TRANSFER_FEE, newTreasury);
        treasury = newTreasury;
    }

    /**
     * @dev May emit a {TransferFeeUpdate} event.
     *
     * Addressed to be used by DAO voting contract
     *
     * @param newFee should consider {TRANSFER_FEE_DIVISOR} to avoid overflow
     *
     * Requirements:
     *
     * - must be a  multisig wallet or owner (requires owner)
     */
    function updateTransferFee(uint256 newFee) external onlyOwner {
        // require(newFee >= 0 && newFee <= TRANSFER_FEE_DIVISOR, "Invalid fee");
        transferFee = newFee;

        emit TransferFeeUpdate(address(msg.sender), newFee);
    }

    function _transfer(
        address from,
        address to,
        uint256 amount
    ) internal override {
        uint256 fee = calculateTransferFee(from, to, amount);

        // The line below can be wrapped in an `unchecked { }` block if `updateTransferFee` can ensure that the fee is never higher than 100%.
        super._transfer(from, to, amount - fee);
        // Saves up some gas if fee is zero
        if (fee > 0) {
            super._transfer(from, transferFeeRecipient, fee);
        }
        // No need for an extra event. If you want to calculate the total of fees paid, you can get all token transfers made to the deployer address.
    }

    function calculateTransferFee(
        address from,
        address to,
        uint256 amount
    ) internal view returns (uint256) {
        if (
            transferFee == 0 ||
            hasRole(NO_TRANSFER_FEE, from) ||
            hasRole(NO_TRANSFER_FEE, to)
        ) {
            return 0;
        }

        uint256 fee = (amount * transferFee) / (TRANSFER_FEE_DIVISOR);
        require(fee > 0, "Transfer amount too low");

        return fee;
    }

    /** @dev Creates `amount` tokens and assigns them to `address(msg.sender)`, increasing
     * the total supply.
     *
     * Limited to 19MM KNN Token Maximum Supply availability.
     *
     * May emit a {Transfer} event (from address(0) to {treasury})
     *
     * Requirements:
     *
     * - must be a `MINTER_ROLE` contract
     * - totalSupply should not exceed {maxSupply}
     */
    function mint(uint256 amount) external onlyRole(MINTER_ROLE) {
        require(treasury != address(0), "No treasury");
        require(amount > 0, "Invalid Amount");
        require(
            totalSupply() + amount <= MAX_SUPPLY,
            "Maximum Supply reached!"
        );

        _mint(treasury, amount);
    }

    /**
     * @dev May emit a {RoleGranted} event.
     *
     * Requirements:
     *
     * - must be a contract owner
     */
    function noTransferFee(address user) external onlyOwner {
        _grantRole(NO_TRANSFER_FEE, user);
    }

    /**
     * @dev May emit a {RoleGranted} event.
     *
     * Addressed to be used by DAO contracts
     *
     * Requirements:
     *
     * - must be a multisig or owner (requires onlyOwner)
     */
    function addMinter(address newMinter) external onlyOwner {
        _grantRole(MINTER_ROLE, newMinter);
    }

    /**
     * @dev May emit a {RoleRevoked} event.
     *
     * Addressed to be used by DAO contracts
     *
     * Requirements:
     *
     * - must be a multisig or owner (requires onlyOwner)
     */
    function removeMinter(address minter) external onlyOwner {
        _revokeRole(MINTER_ROLE, minter);
    }
}
