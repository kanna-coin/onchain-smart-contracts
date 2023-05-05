// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

interface FxERC20ChildTunnel {
    function withdraw(address childToken, uint256 amount) external;

    function withdrawTo(
        address childToken,
        address receiver,
        uint256 amount
    ) external;
}
