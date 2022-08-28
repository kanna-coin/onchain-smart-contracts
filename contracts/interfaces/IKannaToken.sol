// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

interface IKannaToken {
    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) external returns (bool);

    function mint(uint256 amount) external;
}
