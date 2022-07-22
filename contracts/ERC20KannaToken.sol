// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

contract ERC20KannaToken is ERC20, ERC20Burnable, Pausable, Ownable {
    uint256 private _initialSupply = 10000000 * 10 ** decimals();
    uint256 private _maxSupply = 19000000 * 10 ** decimals();

    constructor() ERC20("KannaCoin", "KNN") {
        _mint(address(this), _initialSupply);
    }

    function mint(uint amount) public onlyOwner {
        require(amount + super.totalSupply() <= _maxSupply, "Maximum Supply reached!");

         _mint(address(this), amount);
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function _beforeTokenTransfer(address from, address to, uint256 amount)
        internal
        whenNotPaused
        override
    {
        super._beforeTokenTransfer(from, to, amount);
    }
}