// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

interface ITreasurer {
    function addYieldContract(address yieldPayerAddress, uint256 transferAmount)
        external;

    function transferYield(address to, uint256 amount) external;

    function transferSubscription(address from, uint256 amount) external;
}
