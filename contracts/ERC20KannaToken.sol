// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

import {IKannaToken} from "./interfaces/IKannaToken.sol";

contract ERC20KannaToken is
    IKannaToken,
    ERC20,
    ERC20Burnable,
    Pausable,
    Ownable
{
    uint256 private initialSupply = 10000000 * 10**decimals();
    uint256 private maxSupply = 19000000 * 10**decimals();

    constructor() ERC20("KannaCoin", "KNN") {
        _mint(address(this), initialSupply);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) public override(ERC20, IKannaToken) returns (bool) {
        return super.transferFrom(from, to, amount);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override whenNotPaused {
        super._beforeTokenTransfer(from, to, amount);
    }

    function mint(uint256 amount) external override(IKannaToken) onlyOwner {
        require(
            amount + super.totalSupply() <= maxSupply,
            "Maximum Supply reached!"
        );

        _mint(address(this), amount);
    }
}
