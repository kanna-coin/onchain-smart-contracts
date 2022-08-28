// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

interface ITreasurer {
    function prepareYield(uint256 amount) external;

    function transferYield(address to, uint256 amount) external;

    function transferSubscription(address from, uint256 amount) external;
}
