// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IKannaToken is IERC20 {
    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) external override(IERC20) returns (bool);

    function mint(uint256 amount) external;
}
