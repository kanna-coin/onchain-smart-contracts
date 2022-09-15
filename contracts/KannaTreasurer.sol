// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

import {IKannaToken} from "./interfaces/IKannaToken.sol";
import {ITreasurer} from "./interfaces/ITreasurer.sol";

/** @dev deprecation warning (possible deprecation soon)
 */
contract KannaTreasurer is ITreasurer, AccessControl, Ownable {
    IKannaToken private immutable tokenContract;
    address private erc20kannaTokenAddress;
    uint256 private constant amount = 1000000 * 10**18;

    bytes32 public constant MILESTONES_MINTER_ROLE =
        keccak256("MILESTONES_MINTER_ROLE");

    bytes32 public constant YIELD_PAYER_ROLE = keccak256("YIELD_PAYER_ROLE");

    constructor(address kannaTokenAddress) {
        erc20kannaTokenAddress = kannaTokenAddress;
        tokenContract = IKannaToken(kannaTokenAddress);
    }

    function addYieldContract(address yieldPayerAddress, uint256 transferAmount)
        external
        override(ITreasurer)
        onlyOwner
    {
        _grantRole(YIELD_PAYER_ROLE, yieldPayerAddress);

        tokenContract.transferFrom(
            address(msg.sender),
            yieldPayerAddress,
            transferAmount
        );
    }

    function transferYield(address to, uint256 transferAmount)
        external
        override(ITreasurer)
        onlyRole(YIELD_PAYER_ROLE)
    {
        tokenContract.transfer(to, transferAmount);
    }

    function transferSubscription(address from, uint256 transferAmount)
        external
        override(ITreasurer)
        onlyRole(YIELD_PAYER_ROLE)
    {
        tokenContract.transferFrom(from, address(msg.sender), transferAmount);
    }

    function mintMilestone(uint256 mintAmount)
        external
        onlyRole(MILESTONES_MINTER_ROLE)
    {
        tokenContract.mint(mintAmount);
    }

    function addMilestoneContract(address milestoneContractAddress)
        external
        onlyOwner
    {
        _grantRole(MILESTONES_MINTER_ROLE, milestoneContractAddress);
    }
}
