// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/** @title KNN Token
    @author KANNA
    @custom:github  https://github.com/kanna-coin
    @custom:site https://kannacoin.io
    @custom:discord https://discord.gg/V5KDU8DKCh
    */
contract KannaToken is ERC20, Ownable, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    uint256 public immutable INITIAL_SUPPLY = 10_000_000 * 10**decimals();
    uint256 public immutable MAX_SUPPLY = 19_000_000 * 10**decimals();

    address public treasury;

    event TreasuryUpdate(address indexed sender, address treasury);

    constructor() ERC20("KNN Token", "KNN") {}

    function initializeTreasury() external onlyOwner {
        require(treasury != address(0), "Treasury not set");
        require(totalSupply() == 0, "Treasury already initialized");
        _mint(treasury, INITIAL_SUPPLY);
    }

    function updateTreasury(address newTreasury) external onlyOwner {
        treasury = newTreasury;

        emit TreasuryUpdate(msg.sender, treasury);
    }

    function mint(uint256 amount) external onlyRole(MINTER_ROLE) {
        require(treasury != address(0), "No treasury");
        require(amount > 0, "Invalid Amount");
        require(totalSupply() + amount <= MAX_SUPPLY, "Maximum Supply reached!");

        _mint(treasury, amount);
    }

    function addMinter(address newMinter) external onlyOwner {
        _grantRole(MINTER_ROLE, newMinter);
    }

    function removeMinter(address minter) external onlyOwner {
        _revokeRole(MINTER_ROLE, minter);
    }
}
