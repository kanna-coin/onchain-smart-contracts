// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

import {IKannaToken} from "./interfaces/IKannaToken.sol";

contract ERC20KannaToken is IKannaToken, ERC20Burnable, Pausable, Ownable {
    using SafeMath for uint256;
    using Address for address;

    uint256 private initialSupply = 10000000 * 10**decimals();
    uint256 private maxSupply = 19000000 * 10**decimals();
    event TransferKNN(
        address indexed from,
        address indexed to,
        uint256 amount,
        uint date,
        uint fee
    );

    event MintKNN(address indexed to, uint256 amount, uint date);

    constructor(address deployerAddress) ERC20("KNN Token", "KNN") {
        _mint(deployerAddress, initialSupply);
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
        emit TransferKNN(from, to, amount, block.timestamp, 0);

        super._beforeTokenTransfer(from, to, amount);
    }

    function mint(uint256 amount) external override(IKannaToken) onlyOwner {
        require(
            amount + super.totalSupply() <= maxSupply,
            "Maximum Supply reached!"
        );

        emit MintKNN(address(msg.sender), amount, block.timestamp);

        _mint(address(msg.sender), amount);
    }
}
